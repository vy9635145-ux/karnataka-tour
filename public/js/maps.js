/* Karnataka Tour – map helper (used by destination.html and the dashboard tours).
   - Map engine: Leaflet (loaded from cdnjs when first needed)
   - Tiles: CARTO Voyager (sharp, retina) + OpenStreetMap + Esri satellite
   - Route: OSRM public server (free, no key). Falls back to a straight line if it is busy.
   - Start point: browser location (needs permission) OR a place typed by the user (OpenStreetMap Nominatim). */
const KTMap = (() => {
  const KEY = (window.KT_CONFIG && window.KT_CONFIG.geoapifyKey || '').trim(); // optional Geoapify API key (see js/config.js)
  const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/';
  let loading = null;
  function loadLeaflet() {
    if (window.L) return Promise.resolve();
    if (loading) return loading;
    loading = new Promise((resolve, reject) => {
      const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = CDN + 'leaflet.css'; document.head.appendChild(css);
      const js = document.createElement('script'); js.src = CDN + 'leaflet.js'; js.onload = resolve; js.onerror = () => { loading = null; reject(new Error('leaflet')); };
      document.head.appendChild(js);
    });
    return loading;
  }

  /* ---- user location (asked once, then remembered for this page) ---- */
  let posPromise = null;
  function locate() {
    if (posPromise) return posPromise;
    posPromise = new Promise((resolve, reject) => {
      if (!navigator.geolocation) { reject(new Error('unsupported')); return; }
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, label: 'Your location' }),
        (e) => { posPromise = null; reject(new Error(e.code === 1 ? 'denied' : e.code === 3 ? 'timeout' : 'unavailable')); },
        { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 });
    });
    return posPromise;
  }

  async function geocode(text) {
    if (KEY) {
      const g = await fetch('https://api.geoapify.com/v1/geocode/search?limit=1&filter=countrycode:in&text=' + encodeURIComponent(text) + '&apiKey=' + KEY);
      if (!g.ok) throw new Error('geocode');
      const gj = await g.json(); if (!gj.features || !gj.features.length) throw new Error('notfound');
      const p = gj.features[0].properties; return { lat: p.lat, lng: p.lon, label: (p.formatted || text).split(',').slice(0, 2).join(',') };
    }
    const r = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=' + encodeURIComponent(text), { headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error('geocode');
    const j = await r.json(); if (!j.length) throw new Error('notfound');
    return { lat: +j[0].lat, lng: +j[0].lon, label: j[0].display_name.split(',').slice(0, 2).join(',') };
  }

  const km = (a, b) => { // straight-line distance (haversine)
    const R = 6371, r = (x) => x * Math.PI / 180, dLat = r(b.lat - a.lat), dLng = r(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };
  const dur = (sec) => { const m = Math.round(sec / 60), h = Math.floor(m / 60); return h ? `${h} h ${m % 60} min` : `${m} min`; };

  async function osrm(from, to) {
    const c = new AbortController(); const timer = setTimeout(() => c.abort(), 12000);
    try {
      if (KEY) { // Geoapify routing API (needs the key)
        const r = await fetch(`https://api.geoapify.com/v1/routing?waypoints=${from.lat},${from.lng}|${to.lat},${to.lng}&mode=drive&apiKey=${KEY}`, { signal: c.signal });
        if (!r.ok) throw new Error('route');
        const j = await r.json(), f = j.features && j.features[0]; if (!f) throw new Error('route');
        const lines = f.geometry.type === 'MultiLineString' ? f.geometry.coordinates.flat() : f.geometry.coordinates;
        return { pts: lines.map(([x, y]) => [y, x]), km: f.properties.distance / 1000, sec: f.properties.time };
      }
      const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`, { signal: c.signal });
      if (!r.ok) throw new Error('osrm');
      const j = await r.json(); if (j.code !== 'Ok' || !j.routes.length) throw new Error('osrm');
      const rt = j.routes[0];
      return { pts: rt.geometry.coordinates.map(([x, y]) => [y, x]), km: rt.distance / 1000, sec: rt.duration };
    } finally { clearTimeout(timer); }
  }

  const pin = (cls, html) => L.divIcon({ className: 'kt-pin ' + cls, html: `<span>${html}</span>`, iconSize: [38, 38], iconAnchor: [19, 38], popupAnchor: [0, -34] });

  /* ---- build the whole widget (map + buttons + info) inside `host` ---- */
  async function widget(host, dest, opts = {}) {
    const to = { lat: dest.lat, lng: dest.lng };
    host.innerHTML = `<div class="ktm"><div class="ktm-map" role="region" aria-label="Map of ${esc(dest.name)}"><p class="empty" style="margin:2rem">Loading map…</p></div>
      <div class="ktm-bar"><button type="button" class="btn sm" data-loc>📍 Route from my location</button>
      <span class="ktm-from"><input type="text" data-from maxlength="80" placeholder="or type your starting place, e.g. Bengaluru" aria-label="Starting place"><button type="button" class="btn sm ghost-dark" data-go>Show route</button></span>
      <a class="btn sm ghost-dark" data-gm target="_blank" rel="noreferrer" href="https://www.google.com/maps/dir/?api=1&destination=${to.lat},${to.lng}">Open in Google Maps ↗</a></div>
      <p class="ktm-info" role="status" aria-live="polite"></p></div>`;
    const el = host.querySelector('.ktm-map'), info = host.querySelector('.ktm-info'), gm = host.querySelector('[data-gm]');
    try { await loadLeaflet(); } catch (e) { el.innerHTML = '<p class="empty" style="margin:2rem">The map could not be loaded. Please check your internet connection.</p>'; return; }
    el.innerHTML = '';
    const map = L.map(el, { scrollWheelZoom: false, zoomControl: true }).setView([to.lat, to.lng], 11);
    // Several tile services exist, because some block requests that come from a file:// page (no "Referer").
    // Esri tiles work everywhere, so they are the default when the page is opened as a plain file.
    const esriStreet = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Tiles &copy; Esri' });
    const voyager = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { subdomains: 'abcd', maxZoom: 19, detectRetina: true, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>' });
    const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' });
    const sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Tiles &copy; Esri' });
    const geo = KEY ? L.tileLayer('https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}{r}.png?apiKey=' + KEY, { maxZoom: 19, detectRetina: true, attribution: 'Powered by <a href="https://www.geoapify.com/">Geoapify</a> | &copy; OpenMapTiles &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }) : null;
    (geo || (location.protocol === 'file:' ? esriStreet : voyager)).addTo(map);
    L.control.layers({ ...(geo ? { 'Street map (Geoapify)': geo } : {}), 'Street map (Esri)': esriStreet, 'Street map (CARTO)': voyager, 'OpenStreetMap': osm, 'Satellite': sat }, null, { position: 'topright' }).addTo(map);
    L.control.scale({ imperial: false }).addTo(map);
    map.on('click', () => map.scrollWheelZoom.enable()); map.on('mouseout', () => map.scrollWheelZoom.disable());
    L.marker([to.lat, to.lng], { icon: pin('dest', '📍'), title: dest.name }).addTo(map).bindPopup(`<b>${esc(dest.name)}</b><br>${esc(dest.region)}`).openPopup();
    setTimeout(() => map.invalidateSize(), 200);

    let layer = null;
    const say = (html, bad) => { info.innerHTML = html; info.classList.toggle('bad', !!bad); };
    async function showRoute(from) {
      if (layer) layer.remove(); layer = L.layerGroup().addTo(map);
      L.marker([from.lat, from.lng], { icon: pin('from', '🧍'), title: from.label }).addTo(layer).bindPopup(`<b>Start</b><br>${esc(from.label)}`);
      gm.href = `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${to.lat},${to.lng}&travelmode=driving`;
      say('Finding the best road route…');
      try {
        const r = await osrm(from, to);
        L.polyline(r.pts, { color: '#fff', weight: 9, opacity: .9 }).addTo(layer);
        const line = L.polyline(r.pts, { color: '#a4161a', weight: 5, opacity: .95 }).addTo(layer);
        map.fitBounds(line.getBounds(), { padding: [40, 40] });
        say(`🚗 <b>${Math.round(r.km)} km</b> • about <b>${dur(r.sec)}</b> by road from ${esc(from.label)} to ${esc(dest.name)} <small>(estimate – traffic not included)</small>`);
      } catch (e) {
        const line = L.polyline([[from.lat, from.lng], [to.lat, to.lng]], { color: '#a4161a', weight: 4, dashArray: '8 8' }).addTo(layer);
        map.fitBounds(line.getBounds(), { padding: [40, 40] });
        say(`The road-route service is busy, so a straight line is shown: about <b>${Math.round(km(from, to))} km</b> from ${esc(from.label)}. Use “Open in Google Maps” for turn-by-turn directions.`, true);
      }
    }
    async function fromMe() {
      say('Asking for your location…');
      try { await showRoute(await locate()); }
      catch (e) {
        const m = { denied: 'Location permission is blocked. Allow it in the browser address bar, or type your starting place below.', unsupported: 'This browser cannot share your location. Type your starting place below.', timeout: 'Getting your location took too long. Try again or type your starting place below.', unavailable: 'Your location is not available right now. Type your starting place below.' };
        say(m[e.message] || 'Could not get your location. Type your starting place below.', true);
      }
    }
    async function fromText() {
      const q = host.querySelector('[data-from]').value.trim(); if (!q) { say('Type a starting place first (for example “Bengaluru”).', true); return; }
      say('Searching for “' + esc(q) + '”…');
      try { await showRoute(await geocode(q)); } catch (e) { say(e.message === 'notfound' ? 'That place was not found. Try a bigger city name.' : 'Could not search for the place. Check your internet connection.', true); }
    }
    host.querySelector('[data-loc]').addEventListener('click', fromMe);
    host.querySelector('[data-go]').addEventListener('click', fromText);
    host.querySelector('[data-from]').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); fromText(); } });
    if (opts.auto) fromMe();
    else if (location.protocol === 'file:') say('Tip: open the site with VS Code “Live Server” (http://127.0.0.1:5500) for the most reliable maps and location. Press “Route from my location” to see the road to ' + esc(dest.name) + '.');
    else say('Press “Route from my location” to see the road from where you are to ' + esc(dest.name) + '.');
  }
  return { widget, locate };
})();
