import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';

const storageKey = 'natally-native-auth-flow-v1';
const state = 'a'.repeat(64);
const flow = (provider = 'google') => ({ port: 43021, state, provider, startedAt: Date.now() - 1000, redirecting: provider === 'google' });
const normalize = value => JSON.parse(JSON.stringify(value));
const settle = async () => { for (let i = 0; i < 8; i++) await new Promise(resolve => setImmediate(resolve)); };

async function execute(file, options = {}) {
  const calls = { invoke: [], installed: [], popup: 0, redirects: 0, redirectResults: 0, apps: [], persistence: [], forms: [], history: [], email: [], reset: [], verifiers: [], sms: [], confirms: [] };
  const storage = new Map(options.stored ? [[storageKey, typeof options.stored === 'string' ? options.stored : JSON.stringify(options.stored)]] : []);
  const sessionStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: key => storage.delete(key),
  };
  class Element {
    constructor(tagName) { this.tagName = tagName; this.children = []; this.listeners = new Map(); this.disabled = true; this.hidden = false; this.textContent = ''; this.value = ''; this.isConnected = true; }
    addEventListener(name, callback) { this.listeners.set(name, callback); }
    removeEventListener(name) { this.listeners.delete(name); }
    append(element) { this.children.push(element); }
    click() { if (!this.disabled) this.listeners.get('click')?.(); }
    dispatch(name) { this.listeners.get(name)?.({ preventDefault() {} }); }
    querySelector() { this.button ??= new Element('button'); return this.button; }
    focus() { this.focused = !this.disabled; }
    submit() { calls.forms.push(this); }
  }
  const elements = new Map(['native-auth-status', 'native-auth-continue', 'native-auth-cancel', 'native-auth-description',
    'native-auth-phone-form', 'native-auth-phone', 'native-auth-recaptcha', 'native-auth-code-form', 'native-auth-code', 'native-auth-resend'].map(id => [id, new Element(id)]));
  elements.get('native-auth-phone-form').hidden = elements.get('native-auth-code-form').hidden = true;
  const location = { origin: options.origin ?? 'https://asknatally.online', pathname: '/auth/native.html', search: '', hash: options.hash ?? '' };
  const window = { location, addEventListener() {}, ...(options.native ? { __TAURI_INTERNALS__: {} } : {}) };
  const document = { getElementById: id => elements.get(id), createElement: tag => new Element(tag), body: new Element('body') };
  const auth = { currentUser: null };
  const app = { name: '[DEFAULT]' };
  class FirebaseError extends Error { constructor(code, message = code) { super(message); this.code = code; } }
  class GoogleAuthProvider {
    static credential(idToken, accessToken) { return { idToken, accessToken }; }
    static credentialFromResult(result) { return result.credential; }
  }
  class PhoneAuthProvider { static credential(verificationId, code) { return { verificationId, code }; } }
  class RecaptchaVerifier {
    constructor(owner, container, parameters) {
      if (options.verifierError) throw new FirebaseError(options.verifierError);
      this.cleared = 0;
      calls.verifiers.push({ owner, container, parameters, instance: this });
    }
    clear() { this.cleared++; }
  }
  const result = { verificationId: 'fixture-verification-id', confirm: async code => {
    calls.confirms.push(code);
    if (options.confirmError) throw new FirebaseError(options.confirmError);
    if (options.confirmPending) await options.confirmPending;
  } };
  const context = vm.createContext({ window, document, sessionStorage, URLSearchParams, Error, AbortController,
    history: { replaceState: (_state, _unused, url) => { calls.history.push(url); location.hash = ''; } } });
  const exports = {
    'firebase/app': { FirebaseError, getApp: () => app, getApps: () => [], initializeApp: (_config, name) => { const value = { name: name ?? '[DEFAULT]' }; calls.apps.push(value); return value; } },
    'firebase/auth': {
      GoogleAuthProvider, PhoneAuthProvider, RecaptchaVerifier, getAuth: () => auth,
      signInWithEmailAndPassword: async (owner, email, password) => { calls.email.push({ action: 'signin', owner, email, password }); if (options.emailError) throw new FirebaseError(options.emailError); },
      createUserWithEmailAndPassword: async (owner, email, password) => { calls.email.push({ action: 'signup', owner, email, password }); if (options.emailError) throw new FirebaseError(options.emailError); },
      sendPasswordResetEmail: async (owner, email) => { calls.reset.push({ owner, email }); if (options.resetError) throw new FirebaseError(options.resetError); },
      signInWithPhoneNumber: async (owner, phone, verifier) => {
        calls.sms.push({ owner, phone, verifier });
        if (options.smsError) throw new FirebaseError(options.smsError);
        return options.smsPending ? await options.smsPending : result;
      },
      getRedirectResult: async () => { calls.redirectResults++; return options.redirectResult ?? null; },
      onAuthStateChanged: () => () => {},
      signInWithCredential: async (owner, credential) => { calls.installed.push({ owner, credential }); },
      signInWithPopup: async () => { calls.popup++; if (options.popupError) throw new FirebaseError(options.popupError); return { credential: { providerId: 'google.com', idToken: 'fixture-google-id-token' } }; },
      signInWithRedirect: async () => { calls.redirects++; },
      signOut: async () => {}, browserSessionPersistence: { type: 'SESSION' },
      setPersistence: async (_auth, persistence) => { calls.persistence.push(persistence); },
    },
    './env': { firebaseConfig: () => options.config ?? JSON.stringify({ apiKey: 'fixture-public-config' }) },
    '@tauri-apps/api/core': { invoke: async (command, args) => {
      calls.invoke.push({ command, args });
      if (options.nativeError) throw options.nativeError;
      return 'nativeResult' in options ? options.nativeResult : { provider: 'google', idToken: 'fixture-google-id-token', accessToken: 'fixture-google-access-token' };
    } },
  };
  const modules = new Map();
  for (const [name, values] of Object.entries(exports)) {
    const module = new vm.SyntheticModule(Object.keys(values), function () {
      for (const [key, value] of Object.entries(values)) this.setExport(key, value);
    }, { context, identifier: name });
    await module.link(() => { throw new Error('Unexpected fixture import'); });
    await module.evaluate();
    modules.set(name, module);
  }
  const sourceModules = new Map();
  const loadSource = async filename => {
    if (sourceModules.has(filename)) return sourceModules.get(filename);
    const source = stripTypeScriptTypes(await readFile(new URL(filename, import.meta.url), 'utf8'));
    const loaded = new vm.SourceTextModule(source, { context, identifier: filename,
      importModuleDynamically: specifier => {
        assert.ok(modules.has(specifier), `Unexpected dynamic import ${specifier}`);
        return modules.get(specifier);
      },
    });
    sourceModules.set(filename, loaded);
    await loaded.link(async specifier => {
      if (specifier === './firebase') return loadSource('./firebase.ts');
      assert.ok(modules.has(specifier), `Unexpected import ${specifier}`);
      return modules.get(specifier);
    });
    return loaded;
  };
  const module = await loadSource(file);
  await module.evaluate();
  await settle();
  return { namespace: module.namespace, calls, elements, storage, location, auth, FirebaseError, result };
}

test('native Google installs the system-browser credential through the exact command', async () => {
  for (const method of ['googleSignIn', 'googleSignInForIdToken']) {
    const run = await execute('./firebase.ts', { native: true });
    const returned = await run.namespace[method]();
    assert.deepEqual(normalize(run.calls.invoke), [{ command: 'native_sign_in', args: { provider: 'google' } }]);
    assert.equal(run.calls.popup, 0);
    assert.deepEqual(normalize(run.calls.installed[0].credential), { idToken: 'fixture-google-id-token', accessToken: 'fixture-google-access-token' });
    assert.equal(returned, method === 'googleSignIn' ? undefined : 'fixture-google-id-token');
  }
});

test('native cancellation maps to the existing error and malformed credentials never install', async () => {
  const cancelled = await execute('./firebase.ts', { native: true, nativeError: 'Sign-in cancelled' });
  await assert.rejects(cancelled.namespace.googleSignIn(), error => error.name === 'SignInCancelledError');
  const failed = await execute('./firebase.ts', { native: true, nativeError: 'Cannot open your system browser.' });
  await assert.rejects(failed.namespace.googleSignIn(), error => error === 'Cannot open your system browser.');
  for (const nativeResult of [null, {}, { provider: 'phone', idToken: 'x' }, { provider: 'google', idToken: '' },
    { provider: 'google', idToken: 'x'.repeat(16385) }, { provider: 'google', idToken: 'x', accessToken: 42 }]) {
    const run = await execute('./firebase.ts', { native: true, nativeResult: nativeResult ?? {} });
    await assert.rejects(run.namespace.googleSignInForIdToken());
    assert.equal(run.calls.installed.length, 0);
  }
});

test('web popup still starts synchronously on the caller gesture without native invocation', async () => {
  for (const method of ['googleSignIn', 'googleSignInForIdToken']) {
    const run = await execute('./firebase.ts');
    const promise = run.namespace[method]();
    assert.equal(run.calls.popup, 1);
    assert.equal(run.calls.invoke.length, 0);
    await promise;
  }
  const blocked = await execute('./firebase.ts', { popupError: 'auth/popup-blocked' });
  await blocked.namespace.googleSignIn();
  assert.equal(blocked.calls.redirects, 1);
});

test('invalid origin, fragment, duplicate, state, provider, port and stored expiry reject before Firebase', async () => {
  const hash = `#port=43021&state=${state}&provider=google`;
  const cases = [
    {}, { origin: 'https://astronatally.com', hash }, { origin: 'http://asknatally.online', hash },
    { hash: `${hash}&port=43022` }, { hash: `${hash}&extra=x` },
    { hash: '#port=43021&provider=google' }, { hash: `#port=29999&state=${state}&provider=google` },
    { hash: `#port=65536&state=${state}&provider=google` }, { hash: `#port=0xA80D&state=${state}&provider=google` },
    { hash: `#port=+43021&state=${state}&provider=google` }, { hash: `#port=43021&state=${'A'.repeat(64)}&provider=google` },
    { hash: `#port=43021&state=${state.slice(1)}&provider=google` }, { hash: `#port=43021&state=${state}&provider=github` },
    { stored: { ...flow(), startedAt: Date.now() - 300001 } },
    { stored: { ...flow(), startedAt: Date.now() + 60000 } },
    { stored: { ...flow(), token: 'fixture-unexpected-field' } }, { stored: '{broken' },
  ];
  for (const options of cases) {
    const run = await execute('./nativeAuthPage.ts', options);
    assert.match(run.elements.get('native-auth-status').textContent, /Open Natally and choose Sign in again/);
    assert.equal(run.calls.apps.length, 0);
    assert.equal(run.calls.redirects, 0);
    assert.equal(run.calls.forms.length, 0);
    assert.equal(run.storage.has(storageKey), false);
  }
});

test('fresh launch retains only flow metadata, removes fragment, and starts Google once', async () => {
  const run = await execute('./nativeAuthPage.ts', { hash: `#port=43021&state=${state}&provider=google` });
  assert.equal(run.calls.redirects, 1);
  assert.equal(run.calls.redirectResults, 0);
  assert.deepEqual(run.calls.apps, [{ name: 'natally-native-auth' }]);
  assert.equal(run.calls.persistence[0].type, 'SESSION');
  assert.deepEqual(run.calls.history, ['/auth/native.html']);
  assert.equal(run.location.hash, '');
  assert.deepEqual(Object.keys(JSON.parse(run.storage.get(storageKey))).sort(), ['port', 'provider', 'redirecting', 'startedAt', 'state']);
  run.elements.get('native-auth-continue').click();
  await settle();
  assert.equal(run.calls.redirects, 1);
});

test('real-shaped redirect result posts credentials only to the validated loopback form', async () => {
  const run = await execute('./nativeAuthPage.ts', { stored: flow(), redirectResult: {
    providerId: 'google.com', credential: { providerId: 'google.com', idToken: 'fixture-id-token', accessToken: 'fixture-access-token' },
  } });
  assert.equal(run.calls.forms.length, 1);
  const form = run.calls.forms[0];
  assert.equal(form.action, 'http://127.0.0.1:43021/natally-auth');
  assert.equal(form.method, 'POST');
  assert.equal(form.enctype, 'application/x-www-form-urlencoded');
  assert.equal(form.children.length, 1);
  assert.equal(form.children[0].name, 'credential');
  assert.equal(form.children[0].type, 'hidden');
  assert.deepEqual(JSON.parse(form.children[0].value), { state, provider: 'google', idToken: 'fixture-id-token', accessToken: 'fixture-access-token' });
  assert.equal(run.storage.has(storageKey), false);
  assert.equal(run.calls.redirects, 0);
  assert.ok(!form.action.includes('token'));
});

test('cancel submits no token fields and null redirect result cannot restart itself', async () => {
  const run = await execute('./nativeAuthPage.ts', { stored: flow() });
  assert.equal(run.calls.redirects, 0);
  assert.equal(run.calls.forms.length, 0);
  assert.match(run.elements.get('native-auth-status').textContent, /did not return a sign-in result/);
  run.elements.get('native-auth-cancel').click();
  assert.equal(run.calls.forms.length, 1);
  assert.deepEqual(JSON.parse(run.calls.forms[0].children[0].value), { state, provider: 'google', cancelled: true });
  assert.equal(run.storage.has(storageKey), false);
  const retry = await execute('./nativeAuthPage.ts', { stored: flow() });
  retry.elements.get('native-auth-continue').click();
  await settle();
  assert.equal(retry.calls.redirects, 1);
});

test('invalid returned Google credential retains genuine retry and cancel without a callback', async () => {
  const run = await execute('./nativeAuthPage.ts', { stored: flow(), redirectResult: { credential: { providerId: 'google.com' } } });
  assert.equal(run.calls.forms.length, 0);
  assert.equal(run.elements.get('native-auth-continue').disabled, false);
  assert.equal(run.elements.get('native-auth-cancel').disabled, false);
  assert.match(run.elements.get('native-auth-status').textContent, /valid sign-in credential/);
});

test('email operations use the current Auth, trim email only, and preserve rejection', async () => {
  const run = await execute('./firebase.ts', { native: true });
  await run.namespace.emailSignIn('  person@example.com  ', ' password with spaces ');
  await run.namespace.emailSignUp(' person@example.com ', ' another password ');
  await run.namespace.resetEmailPassword(' person@example.com ');
  assert.deepEqual(normalize(run.calls.email), [
    { action: 'signin', owner: { currentUser: null }, email: 'person@example.com', password: ' password with spaces ' },
    { action: 'signup', owner: { currentUser: null }, email: 'person@example.com', password: ' another password ' },
  ]);
  assert.deepEqual(normalize(run.calls.reset), [{ owner: { currentUser: null }, email: 'person@example.com' }]);
  assert.equal(run.calls.invoke.length, 0);
  for (const method of ['emailSignIn', 'emailSignUp']) {
    const failed = await execute('./firebase.ts', { emailError: 'auth/invalid-credential' });
    await assert.rejects(failed.namespace[method]('person@example.com', 'secret'), error => error.code === 'auth/invalid-credential');
  }
  const failed = await execute('./firebase.ts', { resetError: 'auth/network-request-failed' });
  await assert.rejects(failed.namespace.resetEmailPassword('person@example.com'), error => error.code === 'auth/network-request-failed');
});

test('auth failures distinguish provider, credential, phone and deployment outcomes', async () => {
  const run = await execute('./firebase.ts');
  for (const [method, label] of [['google', 'Google'], ['email', 'Email/password'], ['phone', 'SMS']]) {
    assert.match(run.namespace.describeSignInFailure(new run.FirebaseError('auth/operation-not-allowed'), method), new RegExp(label.replace('/', '\\/')));
    assert.match(run.namespace.describeSignInFailure(new run.namespace.AuthUnavailableError(), method), new RegExp(label.replace('/', '\\/')));
  }
  for (const [code, expected] of [
    ['invalid-email', /valid email/], ['invalid-credential', /email or password/], ['email-already-in-use', /already has an account/],
    ['weak-password', /stronger password/], ['password-does-not-meet-requirements', /six characters/], ['invalid-phone-number', /country code/],
    ['invalid-verification-code', /six digits/], ['code-expired', /expired/], ['captcha-check-failed', /reCAPTCHA/],
    ['quota-exceeded', /quota/], ['network-request-failed', /network/i], ['too-many-requests', /Too many/],
  ]) assert.match(run.namespace.describeSignInFailure(new run.FirebaseError(`auth/${code}`), 'phone'), expected);
  const absent = await execute('./firebase.ts', { config: '' });
  await assert.rejects(absent.namespace.emailSignIn('person@example.com', 'secret'), { name: 'AuthUnavailableError' });
  await assert.rejects(absent.namespace.startPhoneSignIn('+14165550123', run.elements.get('native-auth-recaptcha')), { name: 'AuthUnavailableError' });
});

test('phone challenge normalizes numbers and supplies the mounted container and actual Auth', async () => {
  const run = await execute('./firebase.ts');
  const owner = { name: 'named-native-auth' };
  const container = run.elements.get('native-auth-recaptcha');
  const session = await run.namespace.createPhoneSignInSession(owner, '+1 (416) 555-0123', container);
  assert.equal(run.calls.sms[0].phone, '+14165550123');
  assert.equal(run.calls.sms[0].owner, owner);
  assert.equal(run.calls.verifiers[0].container, container);
  assert.deepEqual(normalize(run.calls.verifiers[0].parameters), { size: 'compact' });
  assert.equal(run.calls.verifiers[0].instance.cleared, 1);
  assert.equal(session.verificationId, 'fixture-verification-id');
  await assert.rejects(session.confirm('12a456'), error => error.code === 'auth/invalid-verification-code');
  await session.confirm('123456');
  assert.deepEqual(run.calls.confirms, ['123456']);
  await assert.rejects(session.confirm('123456'), error => error.code === 'auth/code-expired');
});

test('invalid phone and code inputs never reach the Firebase send or confirm operation', async () => {
  const run = await execute('./firebase.ts');
  for (const phone of ['14165550123', '+04165550123', '+1234567', '+1234567890123456', '+1/4165550123', '+１２３４５６７８']) {
    await assert.rejects(run.namespace.startPhoneSignIn(phone, run.elements.get('native-auth-recaptcha')), error => error.code === 'auth/invalid-phone-number');
  }
  assert.equal(run.calls.sms.length, 0);
  const session = await run.namespace.startPhoneSignIn('+14165550123', run.elements.get('native-auth-recaptcha'));
  assert.equal(run.calls.sms[0].owner, run.auth);
  for (const code of ['12345', '1234567', ' 123456', '１２３４５６']) {
    await assert.rejects(session.confirm(code), error => error.code === 'auth/invalid-verification-code');
  }
  session.dispose(); session.dispose();
  await assert.rejects(session.confirm('123456'), error => error.code === 'auth/code-expired');
  assert.equal(run.calls.confirms.length, 0);
});

test('send failures and aborts clear verifiers once and ignore late challenge results', async () => {
  const failed = await execute('./firebase.ts', { smsError: 'auth/quota-exceeded' });
  await assert.rejects(failed.namespace.startPhoneSignIn('+14165550123', failed.elements.get('native-auth-recaptcha')), error => error.code === 'auth/quota-exceeded');
  assert.equal(failed.calls.verifiers[0].instance.cleared, 1);
  let resolve;
  const pending = new Promise(done => { resolve = done; });
  const run = await execute('./firebase.ts', { smsPending: pending });
  const controller = new AbortController();
  let removed = 0;
  const originalRemove = controller.signal.removeEventListener.bind(controller.signal);
  controller.signal.removeEventListener = (...args) => { removed++; originalRemove(...args); };
  const promise = run.namespace.startPhoneSignIn('+14165550123', run.elements.get('native-auth-recaptcha'), controller.signal);
  const rejected = assert.rejects(promise, { name: 'SignInCancelledError' });
  controller.abort(); await rejected;
  resolve(run.result); await settle();
  assert.equal(run.calls.verifiers[0].instance.cleared, 1);
  assert.ok(removed >= 1);
  assert.equal(run.calls.confirms.length, 0);
  const before = run.calls.verifiers.length;
  await assert.rejects(run.namespace.startPhoneSignIn('+14165550123', run.elements.get('native-auth-recaptcha'), controller.signal), { name: 'SignInCancelledError' });
  assert.equal(run.calls.verifiers.length, before);
});

test('a completed send removes its abort listener and a disposed pending confirmation rejects late success', async () => {
  let resolve;
  const pending = new Promise(done => { resolve = done; });
  const run = await execute('./firebase.ts', { confirmPending: pending });
  const controller = new AbortController();
  const session = await run.namespace.startPhoneSignIn('+14165550123', run.elements.get('native-auth-recaptcha'), controller.signal);
  controller.abort();
  assert.equal(run.calls.verifiers[0].instance.cleared, 1);
  const confirming = session.confirm('123456');
  session.dispose(); resolve();
  await assert.rejects(confirming, { name: 'SignInCancelledError' });
  const failed = await execute('./firebase.ts', { confirmError: 'auth/invalid-verification-code' });
  const rejected = await failed.namespace.startPhoneSignIn('+14165550123', failed.elements.get('native-auth-recaptcha'));
  await assert.rejects(rejected.confirm('654321'), error => error.code === 'auth/invalid-verification-code');
  await assert.rejects(rejected.confirm('123456'), error => error.code === 'auth/invalid-verification-code');
  assert.equal(failed.calls.confirms.length, 2);
});

test('native phone validates and installs only phone credentials, with truthful cancellation', async () => {
  const credential = { provider: 'phone', verificationId: 'fixture-verification-id', code: '123456' };
  const run = await execute('./firebase.ts', { native: true, nativeResult: credential });
  await run.namespace.nativePhoneSignIn();
  assert.deepEqual(normalize(run.calls.invoke), [{ command: 'native_sign_in', args: { provider: 'phone' } }]);
  assert.deepEqual(normalize(run.calls.installed[0].credential), { verificationId: credential.verificationId, code: credential.code });
  assert.equal(run.calls.popup, 0);
  for (const nativeResult of [null, {}, { ...credential, provider: 'google' }, { ...credential, verificationId: '' },
    { ...credential, verificationId: 'x'.repeat(8192) }, { ...credential, code: '１２３４５６' }, { ...credential, code: '12345' },
    { ...credential, idToken: 'fixture-forbidden-token' }, { ...credential, accessToken: 'fixture-forbidden-token' }]) {
    const malformed = await execute('./firebase.ts', { native: true, nativeResult });
    await assert.rejects(malformed.namespace.nativePhoneSignIn(), /invalid SMS credential/);
    assert.equal(malformed.calls.installed.length, 0);
  }
  const cancelled = await execute('./firebase.ts', { native: true, nativeError: 'Sign-in cancelled' });
  await assert.rejects(cancelled.namespace.nativePhoneSignIn(), { name: 'SignInCancelledError' });
  const native = await execute('./firebase.ts', { native: true });
  await native.namespace.cancelNativeSignIn();
  assert.deepEqual(normalize(native.calls.invoke), [{ command: 'cancel_native_sign_in' }]);
  assert.equal(native.namespace.isNativeAuth(), true);
  const web = await execute('./firebase.ts');
  await web.namespace.cancelNativeSignIn();
  assert.equal(web.calls.invoke.length, 0);
  assert.equal(web.namespace.isNativeAuth(), false);
});

test('phone browser flow sends with the named Auth and posts its code without confirming or starting Google', async () => {
  const run = await execute('./nativeAuthPage.ts', { hash: `#port=43021&state=${state}&provider=phone` });
  assert.equal(run.calls.redirects, 0);
  assert.equal(run.calls.redirectResults, 0);
  assert.equal(run.elements.get('native-auth-continue').hidden, true);
  assert.equal(run.elements.get('native-auth-phone-form').hidden, false);
  assert.equal(run.elements.get('native-auth-code-form').hidden, true);
  assert.deepEqual(Object.keys(JSON.parse(run.storage.get(storageKey))).sort(), ['port', 'provider', 'redirecting', 'startedAt', 'state']);
  run.elements.get('native-auth-phone').value = '+1 (416) 555-0123';
  run.elements.get('native-auth-phone-form').dispatch('submit');
  await settle();
  assert.deepEqual(run.calls.apps, [{ name: 'natally-native-auth' }]);
  assert.equal(run.calls.persistence[0].type, 'SESSION');
  assert.equal(run.calls.sms.length, 1);
  assert.equal(run.calls.sms[0].owner, run.auth);
  assert.equal(run.elements.get('native-auth-code-form').hidden, false);
  run.elements.get('native-auth-code').value = '123456';
  run.elements.get('native-auth-code-form').dispatch('submit');
  assert.equal(run.calls.forms[0].action, 'http://127.0.0.1:43021/natally-auth');
  assert.deepEqual(JSON.parse(run.calls.forms[0].children[0].value), { state, provider: 'phone', verificationId: 'fixture-verification-id', code: '123456' });
  assert.equal(run.calls.confirms.length, 0);
  assert.equal(run.calls.installed.length, 0);
  assert.equal(run.storage.has(storageKey), false);
  assert.match(run.elements.get('native-auth-status').textContent, /to verify your SMS code/);
});

test('phone cancellation sends metadata only and a late send cannot reopen the code form', async () => {
  let resolve;
  const pending = new Promise(done => { resolve = done; });
  const run = await execute('./nativeAuthPage.ts', { stored: flow('phone'), smsPending: pending });
  assert.match(run.elements.get('native-auth-status').textContent, /new SMS code/);
  run.elements.get('native-auth-phone').value = '+14165550123';
  run.elements.get('native-auth-phone-form').dispatch('submit');
  await settle();
  run.elements.get('native-auth-cancel').click();
  assert.deepEqual(JSON.parse(run.calls.forms[0].children[0].value), { state, provider: 'phone', cancelled: true });
  resolve(run.result); await settle();
  assert.equal(run.calls.verifiers[0].instance.cleared, 1);
  assert.equal(run.elements.get('native-auth-code-form').hidden, true);
  assert.equal(run.calls.forms.length, 1);
});

test('phone send failures do not reveal a code form and resend replaces the prior challenge', async () => {
  const failed = await execute('./nativeAuthPage.ts', { stored: flow('phone'), smsError: 'auth/operation-not-allowed' });
  failed.elements.get('native-auth-phone').value = '+14165550123';
  failed.elements.get('native-auth-phone-form').dispatch('submit'); await settle();
  assert.match(failed.elements.get('native-auth-status').textContent, /SMS sign-in is disabled/);
  assert.equal(failed.elements.get('native-auth-code-form').hidden, true);
  assert.equal(failed.calls.forms.length, 0);
  const run = await execute('./nativeAuthPage.ts', { stored: flow('phone') });
  run.elements.get('native-auth-phone').value = '+14165550123';
  run.elements.get('native-auth-phone-form').dispatch('submit'); await settle();
  run.elements.get('native-auth-code').value = '12';
  run.elements.get('native-auth-code-form').dispatch('submit');
  assert.equal(run.calls.forms.length, 0);
  run.elements.get('native-auth-resend').click(); await settle();
  assert.equal(run.calls.sms.length, 2);
  assert.equal(run.calls.verifiers.every(value => value.instance.cleared === 1), true);
  assert.equal(run.elements.get('native-auth-code').value, '');
});
