// Firestore persistence seam for the first-light intake
// (DOCS/ARCHITECTURE.md §26). Every answered step is written immediately to
// users/{uid}/private/intake (merge), so a customer who leaves mid-flow
// resumes with their answers intact on any device. Billing/quota-class
// failures surface as truthful blocking errors; transient network failures
// do not block the flow — the sessionStorage stash and Firestore
// re-hydration remain the recovery paths. Unauthenticated = no write.
import { doc, getDoc, setDoc, type Firestore } from 'firebase/firestore';
import { authCurrentUser, firestoreDb } from '../platform/firebase';
import type { IntakeDraft } from './onboarding';

/** Firestore intake storage failed in a way that suggests billing/quota —
 * continuing unpersisted would risk losing the customer's answers, so the
 * journey blocks instead. */
export class IntakePersistenceBillingError extends Error {
  constructor(public readonly cause: unknown) {
    super('Cloud intake storage is unavailable (billing/quota). Blocking to protect your answers.');
    this.name = 'IntakePersistenceBillingError';
  }
}

const BILLING_CODES = new Set([
  'failed-precondition', // Firestore not enabled / billing removed mid-flight
  'resource-exhausted',  // quota
  'unavailable',         // sustained infra outage
]);

const isBillingClass = (err: unknown): boolean => {
  const code = (err as { code?: string })?.code ?? '';
  if (BILLING_CODES.has(code)) return true;
  const msg = err instanceof Error ? err.message.toLowerCase() : '';
  return /billing|quota|exceeded|not enabled/.test(msg) && !/permission/.test(msg);
};

/** The persisted intake document (users/{uid}/private/intake). */
export interface PersistedIntake {
  /** Answers as they accrued; partial until completion. */
  readonly draft: Partial<IntakeDraft>;
  /** Question index reached, or 'done' after a successful cast. */
  readonly step: number | 'done';
  /** The computed birth input, present only after completion. */
  readonly chart?: unknown;
  readonly updatedAt?: string;
}

const intakeDoc = (db: Firestore, uid: string) => doc(db, 'users', uid, 'private', 'intake');

/** Write one step's answers (merge). Never throws for transient network
 * loss; throws IntakePersistenceBillingError for billing-class failures. */
export async function persistIntakeStep(
  step: number,
  draft: Partial<IntakeDraft>,
): Promise<void> {
  const user = authCurrentUser();
  if (!user) return; // signed-out flow persists only to the session stash
  try {
    await setDoc(
      intakeDoc(firestoreDb(), user.uid),
      { draft, step, updatedAt: new Date().toISOString() },
      { merge: true },
    );
  } catch (err) {
    if (isBillingClass(err)) throw new IntakePersistenceBillingError(err);
    // Transient: the flow continues; re-hydration and the stash recover it.
  }
}

/** Write the completed intake (step 'done' plus the computed birth input). */
export async function persistIntakeCompletion(
  draft: IntakeDraft,
  chart: unknown,
): Promise<void> {
  const user = authCurrentUser();
  if (!user) return;
  try {
    await setDoc(
      intakeDoc(firestoreDb(), user.uid),
      { draft, chart, step: 'done', updatedAt: new Date().toISOString() },
      { merge: true },
    );
  } catch (err) {
    if (isBillingClass(err)) throw new IntakePersistenceBillingError(err);
  }
}

/** Read the persisted intake, or null when absent/signed-out/unreadable. */
export async function fetchPersistedIntake(): Promise<PersistedIntake | null> {
  const user = authCurrentUser();
  if (!user) return null;
  try {
    const snap = await getDoc(intakeDoc(firestoreDb(), user.uid));
    if (!snap.exists()) return null;
    const data = snap.data() as PersistedIntake;
    return data && typeof data === 'object' && data.draft ? data : null;
  } catch (err) {
    if (isBillingClass(err)) throw new IntakePersistenceBillingError(err);
    return null;
  }
}
