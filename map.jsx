// SVG NYC abstraction — stylized dark grid + rivers, no real tiles
// Animates a flyTo by transforming the SVG <g> with scale + translate
const { useEffect, useRef, useState } = React;

function NycMap({ target, phase }) {
  // phase: "idle" | "zooming" | "locked"
  const wrapRef = useRef(null);

  // Build a Manhattan-like grid: long avenues + short streets
  const gridLines = [];
  for (let i = 0; i <= 28; i++) {
    const x = 200 + i * 28;
    gridLines.push(<line key={"a" + i} x1={x} y1={20} x2={x - 90} y2={580} stroke="#1a1a1a" strokeWidth="0.6" />);
  }
  for (let j = 0; j <= 22; j++) {
    const y = 30 + j * 26;
    gridLines.push(<line key={"s" + j} x1={120} y1={y} x2={1080} y2={y - 40} stroke="#161616" strokeWidth="0.5" />);
  }

  // Major avenues (slightly thicker)
  const majors = [];
  for (let i = 0; i < 6; i++) {
    const x = 260 + i * 130;
    majors.push(<line key={"m" + i} x1={x} y1={20} x2={x - 90} y2={580} stroke="#262626" strokeWidth="1" />);
  }

  // Hudson + East rivers — soft shapes
  // Coordinates roughly outline manhattan
  const manhattanPath = "M 290 30 L 980 10 L 1050 100 L 1090 230 L 1080 360 L 1020 470 L 940 560 L 820 580 L 700 575 L 560 560 L 410 530 L 280 470 L 200 360 L 180 240 L 220 130 Z";

  // Compute target position
  const tx = target ? target.mapX * 1200 : 600;
  const ty = target ? target.mapY * 600 : 300;

  // Phase transforms
  let scale = 1;
  let originX = 600;
  let originY = 300;
  let opacity = 1;
  if (phase === "zooming" || phase === "locked") {
    scale = 2.6;
    originX = tx;
    originY = ty;
  }

  const transform = `translate(${600 - originX * scale}, ${300 - originY * scale}) scale(${scale})`;

  return (
    <div ref={wrapRef} className="map-wrap">
      <svg viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice" className="map-svg">
        {/* Water */}
        <rect x="0" y="0" width="1200" height="600" fill="#070707" />

        <g style={{ transform, transformOrigin: "0 0", transition: "transform 1500ms cubic-bezier(0.65, 0, 0.35, 1)" }}>
          {/* Manhattan landmass */}
          <path d={manhattanPath} fill="#0d0d0d" stroke="#1f1f1f" strokeWidth="0.8" />

          {/* Brooklyn / Queens hint */}
          <path d="M 940 560 L 1100 540 L 1180 480 L 1200 600 L 940 600 Z" fill="#0c0c0c" stroke="#1a1a1a" strokeWidth="0.6" />
          <path d="M 0 320 L 180 240 L 200 360 L 280 470 L 0 530 Z" fill="#0c0c0c" stroke="#1a1a1a" strokeWidth="0.6" />

          {/* Grid clipped to manhattan */}
          <defs>
            <clipPath id="manClip">
              <path d={manhattanPath} />
            </clipPath>
          </defs>
          <g clipPath="url(#manClip)">
            {gridLines}
            {majors}
            {/* Central Park */}
            <rect x="540" y="160" width="90" height="170" fill="#0a0a0a" stroke="#222" strokeWidth="0.6" />
            {/* Broadway diagonal */}
            <line x1="700" y1="60" x2="380" y2="540" stroke="#2a2a2a" strokeWidth="1.2" />
          </g>

          {/* River labels */}
          <text x="100" y="120" fill="#222" fontSize="9" fontFamily="JetBrains Mono, monospace" letterSpacing="2">HUDSON</text>
          <text x="1080" y="320" fill="#222" fontSize="9" fontFamily="JetBrains Mono, monospace" letterSpacing="2">EAST R.</text>

          {/* Pin once locked */}
          {phase === "locked" && target && (
            <g transform={`translate(${tx}, ${ty})`}>
              <circle r="34" fill="none" stroke="#DC0000" strokeWidth="0.6" opacity="0.5" />
              <circle r="20" fill="none" stroke="#DC0000" strokeWidth="0.6" opacity="0.7" />
              <circle r="10" fill="none" stroke="#DC0000" strokeWidth="0.8" />
              <circle r="2.4" fill="#DC0000" />
            </g>
          )}
        </g>

        {/* Overlay scanlines */}
        <rect x="0" y="0" width="1200" height="600" fill="url(#scan)" opacity="0.4" />
        <defs>
          <pattern id="scan" width="3" height="3" patternUnits="userSpaceOnUse">
            <rect width="3" height="1" fill="#000" opacity="0.25" />
          </pattern>
        </defs>

        {/* Compass / scale */}
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

        {/* Coordinate readout */}
        {target && (
          <g transform="translate(1160, 40)" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="#666" letterSpacing="2" textAnchor="end">
            <text>LAT/LON</text>
            <text y="14" fill="#aaa">{target.coords}</text>
          </g>
        )}
      </svg>

      {/* Crosshair overlay (fixed, fades in after zoom) */}
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

      {/* Phase chyron */}
      <div className="map-chyron">
        <span className="dot-red" />
        <span>{phase === "idle" ? "AWAITING TARGET" : phase === "zooming" ? "FLYTO · ZOOM 11 → 17" : "TARGET ACQUIRED"}</span>
      </div>
    </div>
  );
}

window.NycMap = NycMap;
