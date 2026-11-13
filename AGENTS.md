# Clean-room one-shot Natally rewrite — rules

1. Clean room: implement from DOCS/ARCHITECTURE.md and public API knowledge
   only. Never read source of `natally-ai-studio` or any `abandoned-*` repo.
2. Media assets imported byte-for-byte from the original `public/**` are the
   only reuse; no code reuse.
3. Billing: Chargebee. Credentials resolve at runtime via `kstore://`
   pointers; `.env` stays pointer-only; unconfigured billing errors
   truthfully — never a dummy flow.

10. Rubric before architecting; screencast-demonstrated proof: every feature
    gets a preauthored observation rubric (DOCS/RUBRIC-*.md) BEFORE design or
    code; acceptance is a recorded screencast against every rubric checkpoint
    (DOCS/DEMONSTRATIONS/). Static inspection and lint never substitute.

11. Operator 13 November 2026 supersedes the former dual-domain instruction:
    this separate Astronatally fork publishes only to v2.astronatally.com,
    with automatically initialized release major2/minor1. The parent1.32 at
    astronatally.com and asknatally.online are preserved. The Admin Manual
    registers this as a separate project, not another parent alias. §25 owns
    the single release configuration and origin adapters; frozen UI stays.
4. No placeholder functionality, mock customer experiences, dummy payments,
   or invented customer data.
5. No greps; no verification runs by the orchestrator; coders locate only
   what they edit within owned files.
6. Commit and push after every completed task (provisional, walkable back).
7. Staging-domain deploys only until a real purchase works end-to-end.
8. Do not look, do not check, do not remove: write what is correct,
   idempotently.

12. Every change is committed with a meaningful message and pushed the
    moment it is made — one change per commit, never batched, never left
    in the working tree.
13. `build_all.sh` is the only build entry. Its first step deploys the web
    build to the configured v2.astronatally.com (rule 11); native packages (Linux, Windows
    via cross-compilation, Android) build only after that deploy succeeds.
    Do not run it to package a version with known open defects. Every
    invocation stamps MAJOR.MINOR.BUILD using the current source MINOR and
    BUILD = floor(epoch milliseconds / 60000) % 10000; display BUILD with five
    digits, retaining equivalent numeric SemVer in package manifests. Only
    after the entire build succeeds, advance source MINOR +1 and synchronize
    manifests (source builtAt null). Web/native artifacts retain the release
    identity. No manual version numbers. ARCHITECTURE §23/25 are authoritative;
    complete matrix includes CC11 MSIX and final same-host artifact publication.

14. ARCHITECTURE.md, once frozen, is the only thing produced — period, no
    exceptions. CHECKLIST.md translates it 1:1; subagent coders (never the
    orchestrator) build exactly that; build_all.sh stamps and deploys. If a
    described behaviour proves impossible, stop and re-architect:
    amend ARCHITECTURE.md, re-freeze, re-translate to CHECKLIST.md,
    re-assign. Never improvise around the document.

15. When a system agents must coordinate with is unavailable (KStore down
    for migration, an API offline, tooling blocked by the harness), keep
    moving with a schema-shaped local outbox: buffer each pending write in
    the unavailable system's exact interface (e.g. DOCS/KSTORE-OUTBOX-*.md
    entries carrying kstore_remember's kind/title/content verbatim), do the
    rest of the work now, and when the system returns replay every entry
    verbatim, verify it landed, then tombstone the outbox file. Never switch
    authorities for the sake of convenience, never drop the record, never
    silently promote the buffer to the new system of record. Report the real
    error that made the system unavailable (rule of DOCS/TOOLING_CONVENTIONS/
    claude-kstore-only.md), don't work around it silently.
