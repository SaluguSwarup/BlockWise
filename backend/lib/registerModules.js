/**
 * Mounts every backend/modules/<team>/index.js it finds on disk, under /api (R5).
 *
 * Adding a new API area is: create backend/modules/<team>/index.js exporting an Express router
 * as its default export. Nothing else needs editing — server.js never changes when a team adds
 * or grows their own module, which is what removes the single most likely nightly-merge conflict.
 */
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function registerModules(app, modulesDir) {
  const mounted = [];
  let entries = [];
  try {
    entries = readdirSync(modulesDir).filter((name) => {
      try {
        return statSync(path.join(modulesDir, name)).isDirectory();
      } catch {
        return false;
      }
    });
  } catch {
    return mounted; // modules/ doesn't exist yet — nothing to mount
  }

  for (const name of entries) {
    const indexPath = path.join(modulesDir, name, 'index.js');
    try {
      statSync(indexPath);
    } catch {
      continue; // this team hasn't added a route file yet
    }
    // A relative specifier (not a file:// URL) — plain Node and Vitest's vite-node runner both
    // resolve this natively, avoiding URL-encoding pitfalls with absolute Windows paths.
    let relSpecifier = path.relative(__dirname, indexPath).split(path.sep).join('/');
    if (!relSpecifier.startsWith('.')) relSpecifier = `./${relSpecifier}`;
    const mod = await import(relSpecifier);
    const router = mod.default;
    if (router) {
      app.use('/api', router);
      mounted.push(name);
    }
  }
  return mounted;
}
