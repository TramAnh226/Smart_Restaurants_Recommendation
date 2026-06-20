import { useEffect, useState, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png',
});

async function fetchOSRMRoute(fromLat, fromLng, toLat, toLng) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=true`;
    const data = await (await fetch(url)).json();
    if (data.code === 'Ok' && data.routes?.[0]) {
      const r = data.routes[0];
      return {
        coords: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
        distanceKm: r.distance / 1000,
        durationMin: r.duration / 60,
        steps: r.legs[0].steps.map((s) => ({
          instruction: s.maneuver.type, modifier: s.maneuver.modifier || '',
          name: s.name || 'Đường không tên', distance: s.distance,
        })),
      };
    }
    return null;
  } catch { return null; }
}

function calcBearing(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function formatStep(step) {
  const dir = { right: '↗️ Rẽ phải', left: '↙️ Rẽ trái', 'sharp right': '⤴️ Rẽ phải gấp',
    'sharp left': '⤵️ Rẽ trái gấp', 'slight right': '↗️ Chếch phải',
    'slight left': '↙️ Chếch trái', straight: '⬆️ Đi thẳng', uturn: '🔄 Quay đầu' };
  const type = { depart: '🚗 Xuất phát', arrive: '📍 Đến nơi', turn: dir[step.modifier] || '↪️ Rẽ',
    'new name': '➡️ Tiếp tục', continue: '⬆️ Tiếp tục', roundabout: '🔄 Vòng xoay',
    fork: '🔱 Ngã ba', merge: '🔀 Nhập làn', 'end of road': '🛑 Cuối đường' };
  const p = type[step.instruction] || '➡️ Tiếp tục';
  const d = step.distance >= 1000 ? `${(step.distance/1000).toFixed(1)} km` : `${Math.round(step.distance)} m`;
  return `${p} vào ${step.name} (${d})`;
}

function makeNavArrowSVG(bearing) {
  return `<svg width="48" height="48" viewBox="0 0 48 48" style="transform:rotate(${bearing}deg);filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">
    <path d="M24 4 L38 24 A16 16 0 0 1 10 24 Z" fill="rgba(66,133,244,0.15)"/>
    <circle cx="24" cy="24" r="12" fill="white" stroke="#4285F4" stroke-width="2.5"/>
    <circle cx="24" cy="24" r="7" fill="#4285F4"/>
    <polygon points="24,6 28,18 24,15 20,18" fill="#4285F4" stroke="white" stroke-width="0.8"/>
  </svg>`;
}

function makeDestSVG() {
  return `<svg width="36" height="48" viewBox="0 0 36 48" style="filter:drop-shadow(0 3px 6px rgba(0,0,0,0.35))">
    <path d="M18 46 C18 46 34 30 34 16 A16 16 0 0 0 2 16 C2 30 18 46 18 46Z" fill="#FF6B35" stroke="white" stroke-width="2"/>
    <circle cx="18" cy="16" r="7" fill="white"/><text x="18" y="20" text-anchor="middle" font-size="12">🍽</text>
  </svg>`;
}

function addArrows(map, coords) {
  const arr = []; let acc = 0;
  for (let i = 1; i < coords.length; i++) {
    acc += L.latLng(coords[i-1]).distanceTo(L.latLng(coords[i]));
    if (acc >= 600) {
      acc = 0;
      const a = Math.atan2(coords[i][1]-coords[i-1][1], coords[i][0]-coords[i-1][0])*(180/Math.PI);
      arr.push(L.marker(coords[i], { icon: L.divIcon({
        html: `<div class="route-arrow" style="transform:rotate(${90-a}deg)">›</div>`,
        className: 'route-arrow-container', iconSize: [16,16], iconAnchor: [8,8],
      }), interactive: false }).addTo(map));
    }
  }
  return arr;
}

export default function MapView({ lat, lng, name, showUser = true, height = 400 }) {
  const mapRef = useRef(null), mapI = useRef(null), rLayers = useRef([]), rArrows = useRef([]);
  const [userPos, setUserPos] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeSteps, setRouteSteps] = useState([]);
  const [showDir, setShowDir] = useState(false);
  const [loading, setLoading] = useState(false);
  const [geoFallback, setGeoFallback] = useState(false);
  const [bearing, setBearing] = useState(0);

  useEffect(() => {
    if (!showUser) return;
    const fallback = () => { const p=[10.7769,106.7009]; setUserPos(p); setBearing(calcBearing(p[0],p[1],lat,lng)); setGeoFallback(true); };
    if (!navigator.geolocation) { fallback(); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { const p=[pos.coords.latitude,pos.coords.longitude]; setUserPos(p); setBearing(calcBearing(p[0],p[1],lat,lng)); },
      fallback, { enableHighAccuracy: false, timeout: 8000 }
    );
  }, [lat, lng, showUser]);

  useEffect(() => {
    if (!mapRef.current || !lat || !lng) return;
    if (mapI.current) { mapI.current.remove(); mapI.current = null; }

    const map = L.map(mapRef.current, { center:[lat,lng], zoom:15, scrollWheelZoom:true, zoomControl:false });
    L.control.zoom({ position:'topright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>', maxZoom:19 }).addTo(map);

    // Destination pin
    L.marker([lat,lng], { icon: L.divIcon({ html: makeDestSVG(), className:'dest-marker-container',
      iconSize:[36,48], iconAnchor:[18,48], popupAnchor:[0,-48] }) }).addTo(map)
      .bindPopup(`<strong>🍽️ ${name}</strong>`).openPopup();

    // User navigation arrow
    if (userPos) {
      L.marker(userPos, { icon: L.divIcon({ html: makeNavArrowSVG(bearing),
        className:'nav-marker-container', iconSize:[48,48], iconAnchor:[24,24] }) }).addTo(map)
        .bindPopup('<strong>📍 Vị trí của bạn</strong>');
      // Pulse ring
      L.circleMarker(userPos, { radius:20, color:'#4285F4', fillColor:'#4285F4',
        fillOpacity:0.08, weight:1.5, opacity:0.4, className:'user-pulse-ring' }).addTo(map);
      map.fitBounds(L.latLngBounds([userPos,[lat,lng]]), { padding:[70,70], maxZoom:16 });
    }
    mapI.current = map;
    return () => { if (mapI.current) { mapI.current.remove(); mapI.current = null; } };
  }, [lat, lng, name, userPos, bearing]);

  const clearRoute = useCallback(() => {
    const m = mapI.current; if (!m) return;
    rLayers.current.forEach(l=>m.removeLayer(l)); rArrows.current.forEach(a=>m.removeLayer(a));
    rLayers.current=[]; rArrows.current=[];
  }, []);

  const handleDirections = async () => {
    if (!userPos || !mapI.current) return;
    setLoading(true); setShowDir(true); clearRoute();
    const result = await fetchOSRMRoute(userPos[0],userPos[1],lat,lng);
    if (result) {
      setRouteInfo({ distanceKm:result.distanceKm, durationMin:result.durationMin });
      setRouteSteps(result.steps);
      const shadow = L.polyline(result.coords, { color:'#C04D1A', weight:10, opacity:0.25, lineJoin:'round', lineCap:'round' }).addTo(mapI.current);
      const main = L.polyline(result.coords, { color:'#FF6B35', weight:6, opacity:0.9, lineJoin:'round', lineCap:'round' }).addTo(mapI.current);
      rLayers.current = [shadow, main];
      rArrows.current = addArrows(mapI.current, result.coords);
      mapI.current.fitBounds(main.getBounds(), { padding:[50,50] });
    } else { setRouteInfo(null); setRouteSteps([]); }
    setLoading(false);
  };

  const handleClear = () => { clearRoute(); setShowDir(false); setRouteInfo(null); setRouteSteps([]);
    if (userPos && mapI.current) mapI.current.fitBounds(L.latLngBounds([userPos,[lat,lng]]), { padding:[70,70], maxZoom:16 });
  };

  const handleRecenter = () => {
    const map = mapI.current; if (!map || !userPos) return;
    map.setView(userPos, 16, { animate: true });
  };

  if (!lat || !lng) return null;

  return (
    <div className="map-view">
      <div className="map-wrapper" style={{ height, position:'relative' }}>
        <div ref={mapRef} className="map-container" style={{ height:'100%', width:'100%' }} />
        <div className="map-custom-controls">
          {userPos && <button className="map-ctrl-btn recenter-btn" onClick={handleRecenter} title="Về vị trí của bạn">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" fill="none"/><circle cx="10" cy="10" r="3" fill="#4285F4"/><line x1="10" y1="0" x2="10" y2="5" stroke="currentColor" strokeWidth="1.5"/><line x1="10" y1="15" x2="10" y2="20" stroke="currentColor" strokeWidth="1.5"/><line x1="0" y1="10" x2="5" y2="10" stroke="currentColor" strokeWidth="1.5"/><line x1="15" y1="10" x2="20" y2="10" stroke="currentColor" strokeWidth="1.5"/></svg>
          </button>}
          <button className="map-ctrl-btn" onClick={() => mapI.current?.setView([lat,lng],16,{animate:true})} title="Về quán ăn">🍽️</button>
          {userPos && <button className="map-ctrl-btn" onClick={() => { if(mapI.current && userPos) mapI.current.fitBounds(L.latLngBounds([userPos,[lat,lng]]),{padding:[70,70],maxZoom:16}); }} title="Xem tổng quan">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/><rect x="10" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/><rect x="1" y="10" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/><rect x="10" y="10" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>
          </button>}
        </div>
      </div>

      <div className="map-info-bar">
        <div className="map-info-left">
          {routeInfo ? <span className="map-route-info">🚗 <strong>{routeInfo.distanceKm.toFixed(1)} km</strong>{routeInfo.durationMin && <> · ⏱️ <strong>{Math.ceil(routeInfo.durationMin)} phút</strong></>}</span>
            : <span className="map-distance-hint">Nhấn "Chỉ đường" để xem khoảng cách</span>}
          {geoFallback && <span className="map-geo-note">ℹ️ Dùng vị trí mặc định (TP.HCM)</span>}
        </div>
        <div className="map-info-actions">
          {!showDir ? <button className="btn btn-primary map-directions-btn" onClick={handleDirections} disabled={!userPos||loading}>{loading?'⏳ Đang tải...':'🧭 Chỉ đường'}</button>
            : <button className="btn btn-secondary map-directions-btn" onClick={handleClear}>✕ Ẩn đường đi</button>}
        </div>
      </div>

      {showDir && routeSteps.length > 0 && (
        <div className="map-directions-panel">
          <h3 className="directions-title">🧭 Hướng dẫn đường đi</h3>
          <div className="directions-list">
            {routeSteps.filter(s=>s.distance>5).map((step,i) => (
              <div key={i} className="direction-step"><span className="step-number">{i+1}</span><span className="step-text">{formatStep(step)}</span></div>
            ))}
            <div className="direction-step direction-arrive"><span className="step-number">🏁</span><span className="step-text">Đã đến <strong>{name}</strong></span></div>
          </div>
        </div>
      )}
    </div>
  );
}

