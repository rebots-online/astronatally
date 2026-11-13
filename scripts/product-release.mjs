import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export function readProductRelease(directory = fileURLToPath(new URL('../', import.meta.url))) {
  const config = JSON.parse(readFileSync(join(directory, 'config/product-release.json'), 'utf8'));
  if (!config || typeof config !== 'object' || Array.isArray(config)
      || Object.keys(config).sort().join(',') !== 'initialMinor,projectId,releaseMajor,repository,sourceRole,webOrigin'
      || config.sourceRole !== 'source' || config.repository !== 'rebots-online/astronatally'
      || typeof config.projectId !== 'string' || !/^[a-z][a-z0-9-]*$/.test(config.projectId)
      || !Number.isSafeInteger(config.releaseMajor) || config.releaseMajor < 1
      || !Number.isSafeInteger(config.initialMinor) || config.initialMinor < 0) {
    throw Error('Invalid product release policy in config/product-release.json');
  }
  const origin = new URL(config.webOrigin);
  if (origin.protocol !== 'https:' || origin.origin !== config.webOrigin) {
    throw Error('Product webOrigin must be an HTTPS origin without a path, query or fragment');
  }
  return config;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const config = readProductRelease();
  if (process.argv[2] === 'origin') console.log(config.webOrigin);
  else if (process.argv[2] === 'hostname') console.log(new URL(config.webOrigin).hostname);
  else throw Error('Expected origin or hostname release-policy field');
}
