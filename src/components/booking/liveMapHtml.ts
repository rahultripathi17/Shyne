import type { LatLng } from '../../lib/geocode';

// The page inside the live map: Leaflet (open source) with OpenStreetMap's own tiles (no API key;
// attribution shown, as the OSM tile policy requires; fine for a prototype, use a tile host at scale). It reports the centre when the map
// stops moving, and flies to a point when asked. Works in a native WebView and in a web iframe.

export type MapMessage = { type: 'moving' } | { type: 'center'; lat: number; lng: number } | { type: 'ready' };

export const liveMapHtml = (center: LatLng, zoom = 17) => `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; background: #EEF0F2; }
  .leaflet-control-attribution { font: 9px -apple-system, system-ui, sans-serif; background: rgba(255,255,255,0.7) !important; }
  .leaflet-control-attribution a { color: #555; }
  /* Calmer than the raw OSM palette, so the pin and the card stay the focus. */
  .leaflet-tile-pane { filter: saturate(0.55) brightness(1.04) contrast(0.95); }
</style>
</head>
<body>
<div id="map"></div>
<script>
  function post(msg) {
    var s = JSON.stringify(msg);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(s);
    else if (window.parent) window.parent.postMessage(s, '*');
  }
  var map = L.map('map', { zoomControl: false, attributionControl: true }).setView([${center.lat}, ${center.lng}], ${zoom});
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  map.attributionControl.setPrefix(false);
  map.on('movestart', function () { post({ type: 'moving' }); });
  map.on('moveend', function () { var c = map.getCenter(); post({ type: 'center', lat: c.lat, lng: c.lng }); });
  window.hooraFlyTo = function (lat, lng) { map.flyTo([lat, lng], 17, { duration: 0.8 }); };
  window.addEventListener('message', function (e) {
    try { var m = JSON.parse(e.data); if (m.type === 'fly') window.hooraFlyTo(m.lat, m.lng); } catch (err) {}
  });
  post({ type: 'ready' });
</script>
</body>
</html>`;
