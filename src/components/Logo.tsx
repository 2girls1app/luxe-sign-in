const Logo = () => (
  <div className="flex flex-col items-center gap-2">
    <svg width="120" height="130" viewBox="0 0 120 130" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Hexagon */}
      <polygon
        points="60,5 110,30 110,80 60,105 10,80 10,30"
        stroke="hsl(43, 50%, 55%)"
        strokeWidth="2"
        fill="none"
      />
      {/* Crossed scalpels */}
      <line x1="42" y1="35" x2="78" y2="75" stroke="hsl(43, 50%, 55%)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="78" y1="35" x2="42" y2="75" stroke="hsl(43, 50%, 55%)" strokeWidth="2.5" strokeLinecap="round" />
      {/* Scalpel handles */}
      <line x1="42" y1="35" x2="36" y2="28" stroke="hsl(43, 50%, 55%)" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="78" y1="35" x2="84" y2="28" stroke="hsl(43, 50%, 55%)" strokeWidth="3.5" strokeLinecap="round" />
      {/* Banner background */}
      <rect x="15" y="78" width="90" height="22" rx="2" fill="hsl(43, 40%, 40%)" opacity="0.3" />
      {/* Text */}
      <text x="60" y="68" textAnchor="middle" fill="hsl(43, 50%, 55%)" fontSize="7.5" fontFamily="Arial, sans-serif" fontWeight="600" letterSpacing="1.5">
        ADVANCED SURGICAL
      </text>
      <text x="60" y="92" textAnchor="middle" fill="hsl(43, 50%, 55%)" fontSize="9" fontFamily="Arial, sans-serif" fontWeight="700" letterSpacing="3">
        SOLUTIONS
      </text>
      {/* EST line */}
      <text x="60" y="120" textAnchor="middle" fill="hsl(43, 50%, 55%)" fontSize="7" fontFamily="Arial, sans-serif" letterSpacing="2" opacity="0.7">
        EST. 2009
      </text>
    </svg>
  </div>
);

export default Logo;
