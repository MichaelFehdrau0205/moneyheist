// Mapbox GL implementation — real tiles, real flyTo
// Preserves the crosshair, chyron, and lat/lon overlays from the SVG version
// Falls back to the SVG abstraction if mapbox-gl or token are unavailable
const { useEffect, useRef, useState } = React;

const MAPBOX_TOKEN = document.querySelector('meta[name="mapbox-token"]')?.content;
const MAPBOX_STYLE = "mapbox://styles/mapbox/dark-v11";
const NYC_OVERVIEW = { center: [-73.9857, 40.7484], zoom: 11 };
const TARGET_ZOOM = 16;
const FLYTO_DURATION = 1500;
const FLYTO_EASING = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // easeInOutCubic
const GEOCODING_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places";
const ERROR_DISPLAY_MS = 2000;
const TOKEN_PLACEHOLDER = "REPLACE_WITH_TOKEN";

async function geocodeTarget(name) {
  if (!MAPBOX_TOKEN) throw new Error("Missing Mapbox token");
  const url = `${GEOCODING_URL}/${encodeURIComponent(name)}.json?access_token=${MAPBOX_TOKEN}&proximity=-73.9857,40.7484&limit=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);
  const data = await res.json();
  if (!data.features?.length) throw new Error("No location found");
  const [lng, lat] = data.features[0].center;
  return { lng, lat, place: data.features[0].place_name };
}

function tokenIsValid() {
  return Boolean(MAPBOX_TOKEN) && MAPBOX_TOKEN !== TOKEN_PLACEHOLDER;
}

function NycMap({ target, phase }) {
  const wrapRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const errorTimerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [resolvedCoords, setResolvedCoords] = useState(null);

  // Init Mapbox once
  useEffect(() => {
    if (!window.mapboxgl) {
      console.warn("mapbox-gl not loaded, using SVG fallback");
      setFallbackMode(true);
      return;
    }
    if (!tokenIsValid()) {
      console.warn("Mapbox token missing or unset, using SVG fallback");
      setFallbackMode(true);
      return;
    }
    let map;
    try {
      window.mapboxgl.accessToken = MAPBOX_TOKEN;
      map = new window.mapboxgl.Map({
        container: mapRef.current,
        style: MAPBOX_STYLE,
        center: NYC_OVERVIEW.center,
        zoom: NYC_OVERVIEW.zoom,
        interactive: false,
        attributionControl: true,
      });
      map.on("load", handleMapLoad);
      map.on("error", handleMapError);
      mapInstanceRef.current = map;
    } catch (e) {
      console.error("Mapbox init failed:", e);
      setFallbackMode(true);
      return;
    }
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.remove(); } catch (e) { /* noop */ }
        mapInstanceRef.current = null;
      }
    };
  }, []);

  function handleMapLoad() {
    setMapReady(true);
  }

  function handleMapError(e) {
    console.error("Mapbox error:", e?.error || e);
  }

  function showError(msg) {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    setErrorMessage(msg);
    errorTimerRef.current = setTimeout(() => setErrorMessage(null), ERROR_DISPLAY_MS);
  }

  async function flyToTarget(map, t) {
    let lng = t.lng;
    let lat = t.lat;
    if (lng == null || lat == null) {
      const result = await geocodeTarget(t.name);
      lng = result.lng;
      lat = result.lat;
    }
    setResolvedCoords({ lng, lat });
    map.flyTo({
      center: [lng, lat],
      zoom: TARGET_ZOOM,
      duration: FLYTO_DURATION,
      easing: FLYTO_EASING,
      essential: true,
    });
  }

  function flyToOverview(map) {
    setResolvedCoords(null);
    map.flyTo({
      center: NYC_OVERVIEW.center,
      zoom: NYC_OVERVIEW.zoom,
      duration: FLYTO_DURATION,
      easing: FLYTO_EASING,
      essential: true,
    });
  }

  // React to phase + target changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady) return;
    if (phase === "zooming" && target) {
      flyToTarget(map, target).catch((err) => {
        console.error("FlyTo failed:", err);
        showError("TARGET NOT FOUND");
      });
    } else if (phase === "idle" && !target) {
      flyToOverview(map);
    }
  }, [phase, target, mapReady]);

  if (fallbackMode) {
    return <SvgFallbackMap target={target} phase={phase} unavailable={!tokenIsValid()} />;
  }

  const chyronText = errorMessage
    ? errorMessage
    : phase === "idle"
      ? "AWAITING TARGET"
      : phase === "zooming"
        ? "FLYTO · ZOOM 11 → 17"
        : "TARGET ACQUIRED";

  const coordDisplay = resolvedCoords
    ? `${resolvedCoords.lat.toFixed(4)}° N · ${Math.abs(resolvedCoords.lng).toFixed(4)}° W`
    : target?.coords;

  return (
    <div ref={wrapRef} className="map-wrap">
      <div ref={mapRef} className="map-canvas" />

      {target && coordDisplay && (
        <div className="map-coord-readout">
          <div className="label">LAT/LON</div>
          <div className="value">{coordDisplay}</div>
        </div>
      )}

      <div className={"crosshair " + (phase === "locked" ? "show" : "")}>
        <svg viewBox="-60 -60 120 120">
          <circle r="48" fill="none" stroke="#DC0000" strokeWidth="0.6" opacity="0.45" />
          <circle r="30" fill="none" stroke="#DC0000" strokeWidth="0.7" opacity="0.7" />
          <circle r="14" fill="none" stroke="#DC0000" strokeWidth="1" />
          <line x1="-58" y1="0" x2="-18" y2="0" stroke="#DC0000" strokeWidth="0.8" />
          <line x1="18" y1="0" x2="58" y2="0" stroke="#DC0000" strokeWidth="0.8" />
          <line x1="0" y1="-58" x2="0" y2="-18" stroke="#DC0000" strokeWidth="0.8" />
          <line x1="0" y1="18" x2="0" y2="58" stroke="#DC0000" strokeWidth="0.8" />
          <circle r="2" fill="#DC0000" />
        </svg>
        <div className="crosshair-label">▼ TARGET</div>
      </div>

      <div className="map-chyron">
        <span className="dot-red" />
        <span>{chyronText}</span>
      </div>
    </div>
  );
}

// Preserved SVG fallback — used when mapbox-gl or token are unavailable
function SvgFallbackMap({ target, phase, unavailable }) {
  const gridLines = [];
  for (let i = 0; i <= 28; i++) {
    const x = 200 + i * 28;
    gridLines.push(<line key={"a" + i} x1={x} y1={20} x2={x - 90} y2={580} stroke="#1a1a1a" strokeWidth="0.6" />);
  }
  for (let j = 0; j <= 22; j++) {
    const y = 30 + j * 26;
    gridLines.push(<line key={"s" + j} x1={120} y1={y} x2={1080} y2={y - 40} stroke="#161616" strokeWidth="0.5" />);
  }

  const majors = [];
  for (let i = 0; i < 6; i++) {
    const x = 260 + i * 130;
    majors.push(<line key={"m" + i} x1={x} y1={20} x2={x - 90} y2={580} stroke="#262626" strokeWidth="1" />);
  }

  const manhattanPath = "M 290 30 L 980 10 L 1050 100 L 1090 230 L 1080 360 L 1020 470 L 940 560 L 820 580 L 700 575 L 560 560 L 410 530 L 280 470 L 200 360 L 180 240 L 220 130 Z";

  const tx = target ? target.mapX * 1200 : 600;
  const ty = target ? target.mapY * 600 : 300;

  let scale = 1;
  let originX = 600;
  let originY = 300;
  if (phase === "zooming" || phase === "locked") {
    scale = 2.6;
    originX = tx;
    originY = ty;
  }

  const transform = `translate(${600 - originX * scale}, ${300 - originY * scale}) scale(${scale})`;

  const chyronText = unavailable
    ? "MAP UNAVAILABLE"
    : phase === "idle"
      ? "AWAITING TARGET"
      : phase === "zooming"
        ? "FLYTO · ZOOM 11 → 17"
        : "TARGET ACQUIRED";

  return (
    <div className="map-wrap">
      <svg viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice" className="map-svg">
        <rect x="0" y="0" width="1200" height="600" fill="#070707" />
        <g style={{ transform, transformOrigin: "0 0", transition: "transform 1500ms cubic-bezier(0.65, 0, 0.35, 1)" }}>
          <path d={manhattanPath} fill="#0d0d0d" stroke="#1f1f1f" strokeWidth="0.8" />
          <path d="M 940 560 L 1100 540 L 1180 480 L 1200 600 L 940 600 Z" fill="#0c0c0c" stroke="#1a1a1a" strokeWidth="0.6" />
          <path d="M 0 320 L 180 240 L 200 360 L 280 470 L 0 530 Z" fill="#0c0c0c" stroke="#1a1a1a" strokeWidth="0.6" />
          <defs>
            <clipPath id="manClip">
              <path d={manhattanPath} />
            </clipPath>
          </defs>
          <g clipPath="url(#manClip)">
            {gridLines}
            {majors}
            <rect x="540" y="160" width="90" height="170" fill="#0a0a0a" stroke="#222" strokeWidth="0.6" />
            <line x1="700" y1="60" x2="380" y2="540" stroke="#2a2a2a" strokeWidth="1.2" />
          </g>
          <text x="100" y="120" fill="#222" fontSize="9" fontFamily="JetBrains Mono, monospace" letterSpacing="2">HUDSON</text>
          <text x="1080" y="320" fill="#222" fontSize="9" fontFamily="JetBrains Mono, monospace" letterSpacing="2">EAST R.</text>
          {phase === "locked" && target && (
            <g transform={`translate(${tx}, ${ty})`}>
              <circle r="34" fill="none" stroke="#DC0000" strokeWidth="0.6" opacity="0.5" />
              <circle r="20" fill="none" stroke="#DC0000" strokeWidth="0.6" opacity="0.7" />
              <circle r="10" fill="none" stroke="#DC0000" strokeWidth="0.8" />
              <circle r="2.4" fill="#DC0000" />
            </g>
          )}
        </g>
        <rect x="0" y="0" width="1200" height="600" fill="url(#scan)" opacity="0.4" />
        <defs>
          <pattern id="scan" width="3" height="3" patternUnits="userSpaceOnUse">
            <rect width="3" height="1" fill="#000" opacity="0.25" />
          </pattern>
        </defs>
        <g transform="translate(40, 40)" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="#444" letterSpacing="2">
          <text x="0" y="0">N</text>
          <line x1="3" y1="4" x2="3" y2="22" stroke="#444" strokeWidth="0.6" />
          <polygon points="0,22 6,22 3,28" fill="#444" />
        </g>
        <g transform="translate(40, 540)" fontFamily="JetBrains Mono, monospace" fontSize="8" fill="#444" letterSpacing="2">
          <line x1="0" y1="0" x2="80" y2="0" stroke="#444" strokeWidth="0.6" />
          <line x1="0" y1="-3" x2="0" y2="3" stroke="#444" strokeWidth="0.6" />
          <line x1="80" y1="-3" x2="80" y2="3" stroke="#444" strokeWidth="0.6" />
          <text x="0" y="14">0.5 MI</text>
        </g>
        {target && (
          <g transform="translate(1160, 40)" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="#666" letterSpacing="2" textAnchor="end">
            <text>LAT/LON</text>
            <text y="14" fill="#aaa">{target.coords}</text>
          </g>
        )}
      </svg>

      <div className={"crosshair " + (phase === "locked" ? "show" : "")}>
        <svg viewBox="-60 -60 120 120">
          <circle r="48" fill="none" stroke="#DC0000" strokeWidth="0.6" opacity="0.45" />
          <circle r="30" fill="none" stroke="#DC0000" strokeWidth="0.7" opacity="0.7" />
          <circle r="14" fill="none" stroke="#DC0000" strokeWidth="1" />
          <line x1="-58" y1="0" x2="-18" y2="0" stroke="#DC0000" strokeWidth="0.8" />
          <line x1="18" y1="0" x2="58" y2="0" stroke="#DC0000" strokeWidth="0.8" />
          <line x1="0" y1="-58" x2="0" y2="-18" stroke="#DC0000" strokeWidth="0.8" />
          <line x1="0" y1="18" x2="0" y2="58" stroke="#DC0000" strokeWidth="0.8" />
          <circle r="2" fill="#DC0000" />
        </svg>
        <div className="crosshair-label">▼ TARGET</div>
      </div>

      <div className="map-chyron">
        <span className="dot-red" />
        <span>{chyronText}</span>
      </div>
    </div>
  );
}

window.NycMap = NycMap;
