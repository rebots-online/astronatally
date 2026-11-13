// Landing entry: renders the VERBATIM original marketing implementation
// (src/landing-original/marketing.tsx, operator-authorized port of the
// deployed original v1.42). The module self-mounts into
// #marketing-experience-root (provided by landing.html together with the
// site header and #marketing-account-root) and redirects app-entry query
// params to /app.html, so this entry only loads the port.
//
// The port's own badge code fills [data-natally-version-badge] from a
// meta[name="natally-version"]; this build's identity comes from
// version.json (stamped by build_all.sh), so the meta is planted here
// before the port loads.

import { displayVersion } from '../platform/version';

export {};

const existingMeta = document.querySelector('meta[name="natally-version"]');
if (existingMeta) {
  existingMeta.setAttribute('content', `v${displayVersion}`);
} else {
  const meta = document.createElement('meta');
  meta.name = 'natally-version';
  meta.content = `v${displayVersion}`;
  document.head.appendChild(meta);
}

void import('../landing-original/marketing');
