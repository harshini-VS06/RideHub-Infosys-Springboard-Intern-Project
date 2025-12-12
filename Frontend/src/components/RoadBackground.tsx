export function RoadBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#F9C05E', stopOpacity: 0.4 }} />
            <stop offset="50%" style={{ stopColor: '#F7B34C', stopOpacity: 0.5 }} />
            <stop offset="100%" style={{ stopColor: '#EF8F31', stopOpacity: 0.3 }} />
          </linearGradient>
          <radialGradient id="sunGradient" cx="50%" cy="50%">
            <stop offset="0%" style={{ stopColor: '#F9C05E', stopOpacity: 1 }} />
            <stop offset="70%" style={{ stopColor: '#EF8F31', stopOpacity: 0.6 }} />
            <stop offset="100%" style={{ stopColor: '#F7B34C', stopOpacity: 0.2 }} />
          </radialGradient>
        </defs>
        
        {/* Sky background */}
        <rect width="1200" height="800" fill="url(#skyGradient)" />
        
        {/* Sun with rays */}
        <circle cx="900" cy="150" r="100" fill="url(#sunGradient)" opacity="0.5" />
        <circle cx="900" cy="150" r="70" fill="#F9C05E" opacity="0.8" />
        
        {/* Sun rays */}
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          const x1 = 900 + Math.cos(angle) * 80;
          const y1 = 150 + Math.sin(angle) * 80;
          const x2 = 900 + Math.cos(angle) * 120;
          const y2 = 150 + Math.sin(angle) * 120;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#EF8F31"
              strokeWidth="3"
              opacity="0.4"
            />
          );
        })}
        
        {/* Distant hills - background */}
        <ellipse cx="300" cy="650" rx="400" ry="150" fill="#F7B34C" opacity="0.25" />
        <ellipse cx="700" cy="680" rx="450" ry="140" fill="#EF8F31" opacity="0.2" />
        <ellipse cx="1000" cy="670" rx="380" ry="130" fill="#F9C05E" opacity="0.25" />
        
        {/* Main winding road - curving through the landscape */}
        <path
          d="M -100 800 Q 50 650, 150 550 Q 250 450, 350 400 Q 500 330, 650 300 Q 800 270, 900 200 Q 1000 130, 1100 80 L 1200 50"
          fill="none"
          stroke="#3D5A5D"
          strokeWidth="180"
          opacity="0.2"
        />
        
        {/* Road edges for depth */}
        <path
          d="M -100 800 Q 50 650, 150 550 Q 250 450, 350 400 Q 500 330, 650 300 Q 800 270, 900 200 Q 1000 130, 1100 80 L 1200 50"
          fill="none"
          stroke="#3D5A5D"
          strokeWidth="200"
          opacity="0.1"
        />
        
        {/* Center dashed line */}
        <path
          d="M -100 800 Q 50 650, 150 550 Q 250 450, 350 400 Q 500 330, 650 300 Q 800 270, 900 200 Q 1000 130, 1100 80 L 1200 50"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="6"
          strokeDasharray="30,20"
          opacity="0.5"
        />
        
        {/* Side dashed lines */}
        <path
          d="M -120 815 Q 35 665, 135 565 Q 235 465, 335 415 Q 485 345, 635 315 Q 785 285, 885 215 Q 985 145, 1085 95 L 1200 65"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3"
          strokeDasharray="15,10"
          opacity="0.3"
        />
        <path
          d="M -80 785 Q 65 635, 165 535 Q 265 435, 365 385 Q 515 315, 665 285 Q 815 255, 915 185 Q 1015 115, 1115 65 L 1200 35"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3"
          strokeDasharray="15,10"
          opacity="0.3"
        />
        
        {/* Road milestone markers */}
        <circle cx="200" cy="530" r="12" fill="#EF8F31" opacity="0.6" />
        <circle cx="400" cy="380" r="12" fill="#EF8F31" opacity="0.6" />
        <circle cx="700" cy="280" r="12" fill="#EF8F31" opacity="0.6" />
        <circle cx="950" cy="190" r="12" fill="#EF8F31" opacity="0.6" />
        
        {/* Decorative trees/vegetation along the road */}
        {/* Left side trees */}
        <ellipse cx="80" cy="620" rx="40" ry="60" fill="#3D5A5D" opacity="0.15" />
        <ellipse cx="60" cy="600" rx="25" ry="35" fill="#3D5A5D" opacity="0.2" />
        
        <ellipse cx="280" cy="490" rx="45" ry="65" fill="#3D5A5D" opacity="0.15" />
        <ellipse cx="260" cy="470" rx="28" ry="40" fill="#3D5A5D" opacity="0.2" />
        
        <ellipse cx="520" cy="350" rx="50" ry="70" fill="#3D5A5D" opacity="0.15" />
        <ellipse cx="500" cy="330" rx="30" ry="45" fill="#3D5A5D" opacity="0.2" />
        
        <ellipse cx="820" cy="240" rx="45" ry="65" fill="#3D5A5D" opacity="0.15" />
        <ellipse cx="800" cy="220" rx="28" ry="40" fill="#3D5A5D" opacity="0.2" />
        
        {/* Right side trees */}
        <ellipse cx="300" cy="570" rx="38" ry="55" fill="#3D5A5D" opacity="0.15" />
        <ellipse cx="320" cy="550" rx="24" ry="35" fill="#3D5A5D" opacity="0.2" />
        
        <ellipse cx="550" cy="420" rx="42" ry="60" fill="#3D5A5D" opacity="0.15" />
        <ellipse cx="570" cy="400" rx="26" ry="38" fill="#3D5A5D" opacity="0.2" />
        
        <ellipse cx="780" cy="310" rx="48" ry="68" fill="#3D5A5D" opacity="0.15" />
        <ellipse cx="800" cy="290" rx="29" ry="42" fill="#3D5A5D" opacity="0.2" />
        
        <ellipse cx="1020" cy="170" rx="40" ry="58" fill="#3D5A5D" opacity="0.15" />
        <ellipse cx="1040" cy="150" rx="25" ry="36" fill="#3D5A5D" opacity="0.2" />
        
        {/* Clouds */}
        <ellipse cx="200" cy="120" rx="60" ry="30" fill="#FFFFFF" opacity="0.3" />
        <ellipse cx="230" cy="130" rx="50" ry="25" fill="#FFFFFF" opacity="0.3" />
        <ellipse cx="170" cy="130" rx="45" ry="22" fill="#FFFFFF" opacity="0.3" />
        
        <ellipse cx="600" cy="100" rx="70" ry="35" fill="#FFFFFF" opacity="0.25" />
        <ellipse cx="640" cy="110" rx="55" ry="28" fill="#FFFFFF" opacity="0.25" />
      </svg>
    </div>
  );
}