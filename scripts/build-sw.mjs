import { readdir, readFile, writeFile } from "node:fs/promises";
async function filesAt(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory()
          ? filesAt(`${dir}/${entry.name}`)
          : `${dir}/${entry.name}`,
      ),
    )
  ).flat();
}
const assets = (await filesAt("out/_next/static"))
  .filter((path) => !path.endsWith(".map"))
  .map((path) => path.replace("out/", "/"));
const version = (await readFile(".next/BUILD_ID", "utf8")).trim();
const paths = [
  "/",
  "/manifest.webmanifest",
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  ...assets,
];
await writeFile(
  "out/sw.js",
  `const CACHE = 'flip7-${version}';
const ASSETS = ${JSON.stringify(paths)};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('flip7-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    if (event.request.mode === 'navigate') {
      try { return await fetch(event.request); }
      catch { return await cache.match('/'); }
    }
    const cached = await cache.match(event.request);
    if (cached) return cached;
    try { return await fetch(event.request); }
    catch (error) {
      if (event.request.mode === 'navigate') return await cache.match('/');
      throw error;
    }
  }));
});
`,
);
