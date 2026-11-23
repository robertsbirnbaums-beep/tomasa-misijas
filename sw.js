/* Tomasa misijas: ļauj lietotnei atvērties arī bez interneta.
   Rāda saglabāto versiju uzreiz un fonā ielādē jaunāko (redzama nākamajā atvēršanas reizē).
   Mainot failus, palieliniet versijas numuru zemāk. */
const CACHE = "tomasa-misijas-v1";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  const mine = url.origin === self.location.origin;
  const fonts = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!mine && !fonts) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: mine });
    const net = fetch(e.request)
      .then(r => { if (r && (r.ok || r.type === "opaque")) c.put(e.request, r.clone()); return r; })
      .catch(() => hit || (e.request.mode === "navigate" ? c.match("./index.html") : Response.error()));
    return hit || net;
  }));
});
