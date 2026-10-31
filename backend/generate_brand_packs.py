import os

OUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "images", "medicines"))
os.makedirs(OUT_DIR, exist_ok=True)

PACK_SHOTS = {
    "dolo-650.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <radialGradient id="bgG" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f1f5f9"/>
    </radialGradient>
    <filter id="packDropShadow" x="-10%" y="-10%" width="125%" height="130%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#0f172a" flood-opacity="0.14" />
      <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#0f172a" flood-opacity="0.08" />
    </filter>
    <linearGradient id="foilSheen" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9"/>
      <stop offset="30%" stop-color="#e2e8f0" stop-opacity="0.4"/>
      <stop offset="50%" stop-color="#ffffff" stop-opacity="0.8"/>
      <stop offset="70%" stop-color="#cbd5e1" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#f8fafc" stop-opacity="0.9"/>
    </linearGradient>
    <radialGradient id="pillGrad" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#e0f2fe"/>
      <stop offset="45%" stop-color="#bae6fd"/>
      <stop offset="90%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </radialGradient>
  </defs>

  <!-- Clean Studio Backdrop -->
  <rect width="400" height="400" fill="url(#bgG)"/>

  <!-- Blister Strip Container -->
  <g filter="url(#packDropShadow)" transform="translate(60, 45)">
    <!-- Base Aluminum Foil Strip -->
    <rect x="0" y="0" width="280" height="310" rx="16" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="2"/>
    <rect x="2" y="2" width="276" height="306" rx="14" fill="url(#foilSheen)"/>

    <!-- Foil Embossed Grid Texture -->
    <path d="M 0 50 L 280 50 M 0 115 L 280 115 M 0 180 L 280 180 M 0 245 L 280 245 M 93 0 L 93 310 M 186 0 L 186 310" 
          stroke="#94a3b8" stroke-width="0.75" stroke-dasharray="3,2" opacity="0.45"/>

    <!-- Top Brand Foil Header -->
    <rect x="0" y="0" width="280" height="50" rx="16" fill="#0284c7" clip-path="polygon(0 0, 280 0, 280 50, 0 50)"/>
    <rect x="0" y="38" width="280" height="12" fill="#0369a1"/>
    
    <!-- Micro Labs Brand & Pill Name -->
    <text x="18" y="24" font-family="system-ui, sans-serif" font-size="10" font-weight="800" fill="#bae6fd" letter-spacing="1.5">MICRO LABS</text>
    <text x="18" y="42" font-family="system-ui, sans-serif" font-size="16" font-weight="900" fill="#ffffff" letter-spacing="0.5">DOLO-650</text>
    <text x="210" y="32" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#ffffff" opacity="0.9">15 TABLETS</text>

    <!-- 3x4 Grid of Authentic Dolo 650 Round Sky-Blue Tablets -->
    <!-- Row 1 -->
    <g transform="translate(47, 85)">
      <circle cx="0" cy="0" r="24" fill="url(#pillGrad)" stroke="#0284c7" stroke-width="1.5"/>
      <line x1="-16" y1="0" x2="16" y2="0" stroke="#0369a1" stroke-width="1.5" opacity="0.6"/>
      <text x="0" y="-4" font-family="sans-serif" font-size="8" font-weight="800" fill="#0369a1" text-anchor="middle">DOLO</text>
      <text x="0" y="10" font-family="sans-serif" font-size="8" font-weight="800" fill="#0369a1" text-anchor="middle">650</text>
    </g>
    <g transform="translate(140, 85)">
      <circle cx="0" cy="0" r="24" fill="url(#pillGrad)" stroke="#0284c7" stroke-width="1.5"/>
      <line x1="-16" y1="0" x2="16" y2="0" stroke="#0369a1" stroke-width="1.5" opacity="0.6"/>
      <text x="0" y="-4" font-family="sans-serif" font-size="8" font-weight="800" fill="#0369a1" text-anchor="middle">DOLO</text>
      <text x="0" y="10" font-family="sans-serif" font-size="8" font-weight="800" fill="#0369a1" text-anchor="middle">650</text>
    </g>
    <g transform="translate(233, 85)">
      <circle cx="0" cy="0" r="24" fill="url(#pillGrad)" stroke="#0284c7" stroke-width="1.5"/>
      <line x1="-16" y1="0" x2="16" y2="0" stroke="#0369a1" stroke-width="1.5" opacity="0.6"/>
      <text x="0" y="-4" font-family="sans-serif" font-size="8" font-weight="800" fill="#0369a1" text-anchor="middle">DOLO</text>
      <text x="0" y="10" font-family="sans-serif" font-size="8" font-weight="800" fill="#0369a1" text-anchor="middle">650</text>
    </g>

    <!-- Row 2 -->
    <g transform="translate(47, 150)">
      <circle cx="0" cy="0" r="24" fill="url(#pillGrad)" stroke="#0284c7" stroke-width="1.5"/>
      <line x1="-16" y1="0" x2="16" y2="0" stroke="#0369a1" stroke-width="1.5" opacity="0.6"/>
      <text x="0" y="-4" font-family="sans-serif" font-size="8" font-weight="800" fill="#0369a1" text-anchor="middle">DOLO</text>
      <text x="0" y="10" font-family="sans-serif" font-size="8" font-weight="800" fill="#0369a1" text-anchor="middle">650</text>
    </g>
    <g transform="translate(140, 150)">
      <circle cx="0" cy="0" r="24" fill="url(#pillGrad)" stroke="#0284c7" stroke-width="1.5"/>
      <line x1="-16" y1="0" x2="16" y2="0" stroke="#0369a1" stroke-width="1.5" opacity="0.6"/>
      <text x="0" y="-4" font-family="sans-serif" font-size="8" font-weight="800" fill="#0369a1" text-anchor="middle">DOLO</text>
      <text x="0" y="10" font-family="sans-serif" font-size="8" font-weight="800" fill="#0369a1" text-anchor="middle">650</text>
    </g>
    <g transform="translate(233, 150)">
      <circle cx="0" cy="0" r="24" fill="url(#pillGrad)" stroke="#0284c7" stroke-width="1.5"/>
      <line x1="-16" y1="0" x2="16" y2="0" stroke="#0369a1" stroke-width="1.5" opacity="0.6"/>
      <text x="0" y="-4" font-family="sans-serif" font-size="8" font-weight="800" fill="#0369a1" text-anchor="middle">DOLO</text>
      <text x="0" y="10" font-family="sans-serif" font-size="8" font-weight="800" fill="#0369a1" text-anchor="middle">650</text>
    </g>

    <!-- Row 3 -->
    <g transform="translate(47, 215)">
      <circle cx="0" cy="0" r="24" fill="url(#pillGrad)" stroke="#0284c7" stroke-width="1.5"/>
      <line x1="-16" y1="0" x2="16" y2="0" stroke="#0369a1" stroke-width="1.5" opacity="0.6"/>
      <text x="0" y="-4" font-family="sans-serif" font-size="8" font-weight="800" fill="#0369a1" text-anchor="middle">DOLO</text>
      <text x="0" y="10" font-family="sans-serif" font-size="8" font-weight="800" fill="#0369a1" text-anchor="middle">650</text>
    </g>
    <g transform="translate(140, 215)">
      <circle cx="0" cy="0" r="24" fill="url(#pillGrad)" stroke="#0284c7" stroke-width="1.5"/>
      <line x1="-16" y1="0" x2="16" y2="0" stroke="#0369a1" stroke-width="1.5" opacity="0.6"/>
      <text x="0" y="-4" font-family="sans-serif" font-size="8" font-weight="800" fill="#0369a1" text-anchor="middle">DOLO</text>
      <text x="0" y="10" font-family="sans-serif" font-size="8" font-weight="800" fill="#0369a1" text-anchor="middle">650</text>
    </g>
    <g transform="translate(233, 215)">
      <circle cx="0" cy="0" r="24" fill="url(#pillGrad)" stroke="#0284c7" stroke-width="1.5"/>
      <line x1="-16" y1="0" x2="16" y2="0" stroke="#0369a1" stroke-width="1.5" opacity="0.6"/>
      <text x="0" y="-4" font-family="sans-serif" font-size="8" font-weight="800" fill="#0369a1" text-anchor="middle">DOLO</text>
      <text x="0" y="10" font-family="sans-serif" font-size="8" font-weight="800" fill="#0369a1" text-anchor="middle">650</text>
    </g>

    <!-- Bottom Strip Info -->
    <rect x="0" y="275" width="280" height="35" rx="14" fill="#f8fafc" stroke="#cbd5e1"/>
    <text x="14" y="293" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#475569">Paracetamol Tablets IP 650 mg</text>
    <text x="14" y="304" font-family="monospace" font-size="8" fill="#94a3b8">B.No: DL2491 • EXP: 09/2027</text>
  </g>
</svg>''',

    "pan-40.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <radialGradient id="bgG2" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </radialGradient>
    <filter id="packDropShadow2" x="-10%" y="-10%" width="125%" height="130%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#0f172a" flood-opacity="0.14" />
    </filter>
    <linearGradient id="alkemPurple" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#701a75"/>
      <stop offset="100%" stop-color="#a21caf"/>
    </linearGradient>
    <radialGradient id="entericPill" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="60%" stop-color="#eab308"/>
      <stop offset="100%" stop-color="#ca8a04"/>
    </radialGradient>
  </defs>

  <rect width="400" height="400" fill="url(#bgG2)"/>

  <!-- Alkem Pan-40 Pack -->
  <g filter="url(#packDropShadow2)" transform="translate(60, 50)">
    <!-- Aluminum Silver Strip -->
    <rect x="0" y="0" width="280" height="300" rx="16" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="2"/>
    
    <!-- Top Header Bar Alkem -->
    <rect x="0" y="0" width="280" height="60" rx="16" fill="url(#alkemPurple)"/>
    <text x="20" y="26" font-family="sans-serif" font-size="11" font-weight="800" fill="#f5d0fe" letter-spacing="1">ALKEM LABORATORIES</text>
    <text x="20" y="50" font-family="sans-serif" font-size="22" font-weight="900" fill="#ffffff" letter-spacing="0.5">PAN-40</text>
    <text x="195" y="48" font-family="sans-serif" font-size="10" font-weight="700" fill="#fef08a">15 TABLETS</text>

    <!-- Subtitle -->
    <rect x="0" y="60" width="280" height="24" fill="#fae8ff"/>
    <text x="20" y="76" font-family="sans-serif" font-size="10" font-weight="700" fill="#86198f">Pantoprazole Gastro-resistant Tablets IP 40mg</text>

    <!-- 2x5 Yellow Enteric Coated Tablets -->
    <g transform="translate(70, 120)">
      <ellipse cx="0" cy="0" rx="28" ry="18" fill="url(#entericPill)" stroke="#ca8a04" stroke-width="1.5"/>
      <text x="0" y="4" font-family="sans-serif" font-size="9" font-weight="800" fill="#713f12" text-anchor="middle">PAN 40</text>
    </g>
    <g transform="translate(210, 120)">
      <ellipse cx="0" cy="0" rx="28" ry="18" fill="url(#entericPill)" stroke="#ca8a04" stroke-width="1.5"/>
      <text x="0" y="4" font-family="sans-serif" font-size="9" font-weight="800" fill="#713f12" text-anchor="middle">PAN 40</text>
    </g>

    <g transform="translate(70, 180)">
      <ellipse cx="0" cy="0" rx="28" ry="18" fill="url(#entericPill)" stroke="#ca8a04" stroke-width="1.5"/>
      <text x="0" y="4" font-family="sans-serif" font-size="9" font-weight="800" fill="#713f12" text-anchor="middle">PAN 40</text>
    </g>
    <g transform="translate(210, 180)">
      <ellipse cx="0" cy="0" rx="28" ry="18" fill="url(#entericPill)" stroke="#ca8a04" stroke-width="1.5"/>
      <text x="0" y="4" font-family="sans-serif" font-size="9" font-weight="800" fill="#713f12" text-anchor="middle">PAN 40</text>
    </g>

    <g transform="translate(70, 240)">
      <ellipse cx="0" cy="0" rx="28" ry="18" fill="url(#entericPill)" stroke="#ca8a04" stroke-width="1.5"/>
      <text x="0" y="4" font-family="sans-serif" font-size="9" font-weight="800" fill="#713f12" text-anchor="middle">PAN 40</text>
    </g>
    <g transform="translate(210, 240)">
      <ellipse cx="0" cy="0" rx="28" ry="18" fill="url(#entericPill)" stroke="#ca8a04" stroke-width="1.5"/>
      <text x="0" y="4" font-family="sans-serif" font-size="9" font-weight="800" fill="#713f12" text-anchor="middle">PAN 40</text>
    </g>

    <!-- Footer -->
    <rect x="0" y="275" width="280" height="25" rx="12" fill="#e2e8f0"/>
    <text x="140" y="291" font-family="monospace" font-size="8" fill="#64748b" text-anchor="middle">B.No. PN4022 • MFG: ALKEM • ALU-ALU PACK</text>
  </g>
</svg>''',

    "limcee.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <radialGradient id="bgG3" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#fff7ed"/>
    </radialGradient>
    <filter id="packDropShadow3" x="-10%" y="-10%" width="125%" height="130%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#c2410c" flood-opacity="0.15" />
    </filter>
    <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ea580c"/>
      <stop offset="100%" stop-color="#f97316"/>
    </linearGradient>
    <radialGradient id="chewableOrange" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#ffedd5"/>
      <stop offset="50%" stop-color="#fdba74"/>
      <stop offset="100%" stop-color="#f97316"/>
    </radialGradient>
  </defs>

  <rect width="400" height="400" fill="url(#bgG3)"/>

  <g filter="url(#packDropShadow3)" transform="translate(60, 50)">
    <!-- Base Blister -->
    <rect x="0" y="0" width="280" height="300" rx="16" fill="#fff7ed" stroke="#fed7aa" stroke-width="2"/>

    <!-- Header Abbott Limcee -->
    <rect x="0" y="0" width="280" height="58" rx="16" fill="url(#orangeGrad)"/>
    <text x="18" y="24" font-family="sans-serif" font-size="10" font-weight="800" fill="#ffedd5" letter-spacing="1">ABBOTT</text>
    <text x="18" y="48" font-family="sans-serif" font-size="22" font-weight="900" fill="#ffffff" letter-spacing="0.5">Limcee 500mg</text>
    <text x="185" y="44" font-family="sans-serif" font-size="10" font-weight="700" fill="#ffedd5">15 CHEWABLE TABS</text>

    <!-- Sub-header -->
    <rect x="0" y="58" width="280" height="24" fill="#ffedd5"/>
    <text x="18" y="74" font-family="sans-serif" font-size="10" font-weight="700" fill="#9a3412">Vitamin C (Ascorbic Acid) Chewable Tablets • Orange Flavour</text>

    <!-- 3x3 Big Chewable Orange Tablets -->
    <g transform="translate(52, 120)">
      <circle cx="0" cy="0" r="26" fill="url(#chewableOrange)" stroke="#ea580c" stroke-width="1.5"/>
      <text x="0" y="4" font-family="sans-serif" font-size="9" font-weight="900" fill="#7c2d12" text-anchor="middle">500</text>
    </g>
    <g transform="translate(140, 120)">
      <circle cx="0" cy="0" r="26" fill="url(#chewableOrange)" stroke="#ea580c" stroke-width="1.5"/>
      <text x="0" y="4" font-family="sans-serif" font-size="9" font-weight="900" fill="#7c2d12" text-anchor="middle">500</text>
    </g>
    <g transform="translate(228, 120)">
      <circle cx="0" cy="0" r="26" fill="url(#chewableOrange)" stroke="#ea580c" stroke-width="1.5"/>
      <text x="0" y="4" font-family="sans-serif" font-size="9" font-weight="900" fill="#7c2d12" text-anchor="middle">500</text>
    </g>

    <g transform="translate(52, 195)">
      <circle cx="0" cy="0" r="26" fill="url(#chewableOrange)" stroke="#ea580c" stroke-width="1.5"/>
      <text x="0" y="4" font-family="sans-serif" font-size="9" font-weight="900" fill="#7c2d12" text-anchor="middle">500</text>
    </g>
    <g transform="translate(140, 195)">
      <circle cx="0" cy="0" r="26" fill="url(#chewableOrange)" stroke="#ea580c" stroke-width="1.5"/>
      <text x="0" y="4" font-family="sans-serif" font-size="9" font-weight="900" fill="#7c2d12" text-anchor="middle">500</text>
    </g>
    <g transform="translate(228, 195)">
      <circle cx="0" cy="0" r="26" fill="url(#chewableOrange)" stroke="#ea580c" stroke-width="1.5"/>
      <text x="0" y="4" font-family="sans-serif" font-size="9" font-weight="900" fill="#7c2d12" text-anchor="middle">500</text>
    </g>

    <!-- Bottom -->
    <rect x="0" y="265" width="280" height="35" rx="14" fill="#fed7aa"/>
    <text x="140" y="287" font-family="sans-serif" font-size="10" font-weight="700" fill="#9a3412" text-anchor="middle">Immunity Booster • Daily Vitamin C</text>
  </g>
</svg>''',

    "augmentin-625.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <radialGradient id="bgG4" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </radialGradient>
    <filter id="packDropShadow4" x="-10%" y="-10%" width="125%" height="130%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#0f172a" flood-opacity="0.14" />
    </filter>
  </defs>

  <rect width="400" height="400" fill="url(#bgG4)"/>

  <!-- Augmentin / Amoxyclav Duo Box -->
  <g filter="url(#packDropShadow4)" transform="translate(65, 55)">
    <!-- Main Box Carton -->
    <rect x="0" y="0" width="270" height="290" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>

    <!-- Left Color Accent Brand Strip -->
    <rect x="0" y="0" width="16" height="290" rx="12" fill="#ea580c"/>

    <!-- GSK Top Header -->
    <g transform="translate(30, 25)">
      <circle cx="12" cy="12" r="12" fill="#ea580c"/>
      <text x="12" y="16" font-family="sans-serif" font-size="9" font-weight="900" fill="#ffffff" text-anchor="middle">gsk</text>
      <text x="32" y="16" font-family="sans-serif" font-size="10" font-weight="800" fill="#64748b">GlaxoSmithKline</text>
    </g>

    <!-- Rx Badge -->
    <rect x="210" y="20" width="40" height="22" rx="4" fill="#fee2e2" stroke="#fca5a5"/>
    <text x="230" y="35" font-family="sans-serif" font-size="10" font-weight="800" fill="#b91c1c" text-anchor="middle">Rx</text>

    <!-- Big Brand Name -->
    <text x="30" y="90" font-family="sans-serif" font-size="22" font-weight="900" fill="#1e293b" letter-spacing="-0.5">Augmentin 625 Duo</text>
    <text x="30" y="112" font-family="sans-serif" font-size="11" font-weight="700" fill="#ea580c">Amoxycillin and Potassium Clavulanate Tablets IP</text>

    <!-- Composition Table -->
    <rect x="30" y="130" width="215" height="75" rx="8" fill="#f8fafc" stroke="#e2e8f0"/>
    <text x="40" y="150" font-family="sans-serif" font-size="9" font-weight="700" fill="#334155">Each film-coated tablet contains:</text>
    <text x="40" y="168" font-family="sans-serif" font-size="9" fill="#475569">• Amoxycillin Trihydrate IP eq. to 500 mg</text>
    <text x="40" y="186" font-family="sans-serif" font-size="9" fill="#475569">• Potassium Clavulanate IP eq. to 125 mg</text>

    <!-- Foil Strip Peek In Box -->
    <g transform="translate(30, 220)">
      <rect x="0" y="0" width="215" height="42" rx="6" fill="#e2e8f0" stroke="#94a3b8" stroke-dasharray="4,2"/>
      <circle cx="35" cy="21" r="12" fill="#ffffff" stroke="#cbd5e1"/>
      <circle cx="85" cy="21" r="12" fill="#ffffff" stroke="#cbd5e1"/>
      <circle cx="135" cy="21" r="12" fill="#ffffff" stroke="#cbd5e1"/>
      <circle cx="185" cy="21" r="12" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="108" y="25" font-family="sans-serif" font-size="8" font-weight="800" fill="#64748b" text-anchor="middle">10 TABLETS FOIL PACK</text>
    </g>

    <!-- Bottom Bar -->
    <rect x="0" y="275" width="270" height="15" rx="8" fill="#ea580c"/>
  </g>
</svg>''',

    "cipladine.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <radialGradient id="bgG5" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#fefce8"/>
    </radialGradient>
    <filter id="packDropShadow5" x="-10%" y="-10%" width="125%" height="130%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#854d0e" flood-opacity="0.14" />
    </filter>
    <linearGradient id="ciplaYellow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="40%" stop-color="#facc15"/>
      <stop offset="100%" stop-color="#eab308"/>
    </linearGradient>
  </defs>

  <rect width="400" height="400" fill="url(#bgG5)"/>

  <!-- Cipladine Tube Angle Shot -->
  <g filter="url(#packDropShadow5)" transform="translate(140, 40) rotate(15)">
    <!-- White Screw Cap -->
    <rect x="25" y="0" width="40" height="24" rx="4" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
    <line x1="32" y1="0" x2="32" y2="24" stroke="#94a3b8" stroke-width="1"/>
    <line x1="45" y1="0" x2="45" y2="24" stroke="#94a3b8" stroke-width="1"/>
    <line x1="58" y1="0" x2="58" y2="24" stroke="#94a3b8" stroke-width="1"/>

    <!-- Tube Shoulder -->
    <path d="M 20 24 L 70 24 L 85 45 L 5 45 Z" fill="#eab308" stroke="#ca8a04"/>

    <!-- Main Yellow Tube Body -->
    <rect x="5" y="45" width="80" height="220" fill="url(#ciplaYellow)" stroke="#ca8a04"/>

    <!-- Brand Typography Vertical -->
    <g transform="translate(48, 160) rotate(-90)">
      <text x="0" y="0" font-family="sans-serif" font-size="18" font-weight="900" fill="#15803d" text-anchor="middle" letter-spacing="1">CIPLADINE</text>
      <text x="0" y="14" font-family="sans-serif" font-size="9" font-weight="700" fill="#713f12" text-anchor="middle">POVIDONE IODINE OINTMENT USP 5% w/w</text>
    </g>

    <!-- Cipla Cross Logo at Top of Body -->
    <circle cx="45" cy="70" r="14" fill="#ffffff"/>
    <path d="M 40 70 L 50 70 M 45 65 L 45 75" stroke="#15803d" stroke-width="3" stroke-linecap="round"/>

    <!-- Antiseptic Microbicidal Water Soluble Badge -->
    <rect x="15" y="215" width="60" height="22" rx="4" fill="#15803d"/>
    <text x="45" y="229" font-family="sans-serif" font-size="7.5" font-weight="800" fill="#ffffff" text-anchor="middle">ANTISEPTIC</text>

    <!-- Bottom Crimped Seal -->
    <rect x="0" y="265" width="90" height="15" rx="2" fill="#a16207" stroke="#713f12"/>
    <line x1="5" y1="272" x2="85" y2="272" stroke="#fef08a" stroke-width="1" stroke-dasharray="2,2"/>
  </g>
</svg>''',

    "volini.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <radialGradient id="bgG6" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#eff6ff"/>
    </radialGradient>
    <filter id="packDropShadow6" x="-10%" y="-10%" width="125%" height="130%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#1e3a8a" flood-opacity="0.16" />
    </filter>
    <linearGradient id="voliniBlue" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1e3a8a"/>
      <stop offset="60%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#1d4ed8"/>
    </linearGradient>
  </defs>

  <rect width="400" height="400" fill="url(#bgG6)"/>

  <!-- Volini Pain Relief Gel Tube -->
  <g filter="url(#packDropShadow6)" transform="translate(135, 40) rotate(-10)">
    <!-- Ergonomic Ribbed Cap -->
    <rect x="30" y="0" width="46" height="26" rx="6" fill="#f97316" stroke="#ea580c"/>
    <line x1="38" y1="0" x2="38" y2="26" stroke="#ffffff" stroke-width="1" opacity="0.6"/>
    <line x1="53" y1="0" x2="53" y2="26" stroke="#ffffff" stroke-width="1" opacity="0.6"/>
    <line x1="68" y1="0" x2="68" y2="26" stroke="#ffffff" stroke-width="1" opacity="0.6"/>

    <!-- Tube Shoulder -->
    <path d="M 25 26 L 80 26 L 98 48 L 8 48 Z" fill="#1e3a8a"/>

    <!-- Main Blue Body -->
    <rect x="8" y="48" width="90" height="225" fill="url(#voliniBlue)"/>

    <!-- Fiery Orange Heat Wave -->
    <path d="M 8 100 Q 53 130 98 100 L 98 160 Q 53 190 8 160 Z" fill="#f97316"/>

    <!-- Brand Typography Vertical -->
    <g transform="translate(53, 155) rotate(-90)">
      <text x="0" y="0" font-family="sans-serif" font-size="22" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1.5">VOLINI</text>
      <text x="0" y="14" font-family="sans-serif" font-size="8" font-weight="800" fill="#fed7aa" text-anchor="middle">MAX STRENGTH PAIN RELIEF GEL</text>
    </g>

    <!-- Fast Relief 2 Minutes Badge -->
    <circle cx="53" cy="225" r="16" fill="#ffffff"/>
    <text x="53" y="222" font-family="sans-serif" font-size="7" font-weight="900" fill="#1e3a8a" text-anchor="middle">INSTANT</text>
    <text x="53" y="231" font-family="sans-serif" font-size="7" font-weight="900" fill="#ea580c" text-anchor="middle">RELIEF</text>

    <!-- Bottom Crimp -->
    <rect x="0" y="273" width="106" height="15" rx="3" fill="#1e3a8a" stroke="#172554"/>
  </g>
</svg>''',

    "shelcal-500.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <radialGradient id="bgG7" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f0fdf4"/>
    </radialGradient>
    <filter id="packDropShadow7" x="-10%" y="-10%" width="125%" height="130%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#166534" flood-opacity="0.14" />
    </filter>
    <radialGradient id="shelcalPill" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="60%" stop-color="#f1f5f9"/>
      <stop offset="100%" stop-color="#cbd5e1"/>
    </radialGradient>
  </defs>

  <rect width="400" height="400" fill="url(#bgG7)"/>

  <!-- Shelcal 500 / Cipcal 500 Strip -->
  <g filter="url(#packDropShadow7)" transform="translate(60, 50)">
    <rect x="0" y="0" width="280" height="300" rx="16" fill="#f8fafc" stroke="#bbf7d0" stroke-width="2"/>

    <!-- Green Header Torrent / Cipla -->
    <rect x="0" y="0" width="280" height="58" rx="16" fill="#166534"/>
    <text x="20" y="24" font-family="sans-serif" font-size="10" font-weight="800" fill="#bbf7d0" letter-spacing="1">TORRENT PHARMA</text>
    <text x="20" y="48" font-family="sans-serif" font-size="22" font-weight="900" fill="#ffffff" letter-spacing="0.5">Shelcal 500</text>
    <text x="195" y="44" font-family="sans-serif" font-size="10" font-weight="700" fill="#bbf7d0">15 TABLETS</text>

    <!-- Subtitle -->
    <rect x="0" y="58" width="280" height="24" fill="#dcfce7"/>
    <text x="20" y="74" font-family="sans-serif" font-size="9.5" font-weight="700" fill="#14532d">Calcium 500 mg + Vitamin D3 250 IU Tablets IP</text>

    <!-- 3x3 White Scored Tablets -->
    <g transform="translate(55, 120)">
      <circle cx="0" cy="0" r="26" fill="url(#shelcalPill)" stroke="#94a3b8" stroke-width="1.5"/>
      <line x1="-16" y1="0" x2="16" y2="0" stroke="#94a3b8" stroke-width="1.5"/>
      <text x="0" y="-4" font-family="sans-serif" font-size="7.5" font-weight="800" fill="#475569" text-anchor="middle">SHELCAL</text>
      <text x="0" y="9" font-family="sans-serif" font-size="7.5" font-weight="800" fill="#475569" text-anchor="middle">500</text>
    </g>
    <g transform="translate(140, 120)">
      <circle cx="0" cy="0" r="26" fill="url(#shelcalPill)" stroke="#94a3b8" stroke-width="1.5"/>
      <line x1="-16" y1="0" x2="16" y2="0" stroke="#94a3b8" stroke-width="1.5"/>
      <text x="0" y="-4" font-family="sans-serif" font-size="7.5" font-weight="800" fill="#475569" text-anchor="middle">SHELCAL</text>
      <text x="0" y="9" font-family="sans-serif" font-size="7.5" font-weight="800" fill="#475569" text-anchor="middle">500</text>
    </g>
    <g transform="translate(225, 120)">
      <circle cx="0" cy="0" r="26" fill="url(#shelcalPill)" stroke="#94a3b8" stroke-width="1.5"/>
      <line x1="-16" y1="0" x2="16" y2="0" stroke="#94a3b8" stroke-width="1.5"/>
      <text x="0" y="-4" font-family="sans-serif" font-size="7.5" font-weight="800" fill="#475569" text-anchor="middle">SHELCAL</text>
      <text x="0" y="9" font-family="sans-serif" font-size="7.5" font-weight="800" fill="#475569" text-anchor="middle">500</text>
    </g>

    <g transform="translate(55, 195)">
      <circle cx="0" cy="0" r="26" fill="url(#shelcalPill)" stroke="#94a3b8" stroke-width="1.5"/>
      <line x1="-16" y1="0" x2="16" y2="0" stroke="#94a3b8" stroke-width="1.5"/>
      <text x="0" y="-4" font-family="sans-serif" font-size="7.5" font-weight="800" fill="#475569" text-anchor="middle">SHELCAL</text>
      <text x="0" y="9" font-family="sans-serif" font-size="7.5" font-weight="800" fill="#475569" text-anchor="middle">500</text>
    </g>
    <g transform="translate(140, 195)">
      <circle cx="0" cy="0" r="26" fill="url(#shelcalPill)" stroke="#94a3b8" stroke-width="1.5"/>
      <line x1="-16" y1="0" x2="16" y2="0" stroke="#94a3b8" stroke-width="1.5"/>
      <text x="0" y="-4" font-family="sans-serif" font-size="7.5" font-weight="800" fill="#475569" text-anchor="middle">SHELCAL</text>
      <text x="0" y="9" font-family="sans-serif" font-size="7.5" font-weight="800" fill="#475569" text-anchor="middle">500</text>
    </g>
    <g transform="translate(225, 195)">
      <circle cx="0" cy="0" r="26" fill="url(#shelcalPill)" stroke="#94a3b8" stroke-width="1.5"/>
      <line x1="-16" y1="0" x2="16" y2="0" stroke="#94a3b8" stroke-width="1.5"/>
      <text x="0" y="-4" font-family="sans-serif" font-size="7.5" font-weight="800" fill="#475569" text-anchor="middle">SHELCAL</text>
      <text x="0" y="9" font-family="sans-serif" font-size="7.5" font-weight="800" fill="#475569" text-anchor="middle">500</text>
    </g>

    <!-- Bottom -->
    <rect x="0" y="265" width="280" height="35" rx="14" fill="#166534"/>
    <text x="140" y="287" font-family="sans-serif" font-size="10" font-weight="800" fill="#ffffff" text-anchor="middle">STRONG BONES &amp; TEETH • NATURAL CALCIUM</text>
  </g>
</svg>''',

    "becosules.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <radialGradient id="bgG8" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#fefce8"/>
    </radialGradient>
    <filter id="packDropShadow8" x="-10%" y="-10%" width="125%" height="130%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#713f12" flood-opacity="0.15" />
    </filter>
  </defs>

  <rect width="400" height="400" fill="url(#bgG8)"/>

  <!-- Becosules / B-Complex Capsule Blister -->
  <g filter="url(#packDropShadow8)" transform="translate(60, 50)">
    <rect x="0" y="0" width="280" height="300" rx="16" fill="#1e293b" stroke="#0f172a" stroke-width="2"/>

    <!-- Golden Header -->
    <rect x="0" y="0" width="280" height="58" rx="16" fill="#ca8a04"/>
    <text x="20" y="24" font-family="sans-serif" font-size="10" font-weight="800" fill="#fef08a" letter-spacing="1">PFIZER / CADILA</text>
    <text x="20" y="48" font-family="sans-serif" font-size="22" font-weight="900" fill="#ffffff" letter-spacing="0.5">BECOSULES</text>
    <text x="190" y="44" font-family="sans-serif" font-size="10" font-weight="800" fill="#fef08a">20 CAPSULES</text>

    <!-- Subtitle -->
    <rect x="0" y="58" width="280" height="24" fill="#334155"/>
    <text x="20" y="74" font-family="sans-serif" font-size="9.5" font-weight="700" fill="#fef08a">B-Complex Forte with Vitamin C &amp; Zinc Capsules</text>

    <!-- 2x3 Two-Tone Maroon & Yellow Capsules -->
    <g transform="translate(70, 125)">
      <rect x="-16" y="-30" width="32" height="30" rx="16" fill="#881337"/>
      <rect x="-16" y="0" width="32" height="30" rx="16" fill="#eab308"/>
      <text x="0" y="-12" font-family="sans-serif" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle">B</text>
      <text x="0" y="18" font-family="sans-serif" font-size="8" font-weight="900" fill="#713f12" text-anchor="middle">Z</text>
    </g>
    <g transform="translate(210, 125)">
      <rect x="-16" y="-30" width="32" height="30" rx="16" fill="#881337"/>
      <rect x="-16" y="0" width="32" height="30" rx="16" fill="#eab308"/>
      <text x="0" y="-12" font-family="sans-serif" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle">B</text>
      <text x="0" y="18" font-family="sans-serif" font-size="8" font-weight="900" fill="#713f12" text-anchor="middle">Z</text>
    </g>

    <g transform="translate(70, 205)">
      <rect x="-16" y="-30" width="32" height="30" rx="16" fill="#881337"/>
      <rect x="-16" y="0" width="32" height="30" rx="16" fill="#eab308"/>
      <text x="0" y="-12" font-family="sans-serif" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle">B</text>
      <text x="0" y="18" font-family="sans-serif" font-size="8" font-weight="900" fill="#713f12" text-anchor="middle">Z</text>
    </g>
    <g transform="translate(210, 205)">
      <rect x="-16" y="-30" width="32" height="30" rx="16" fill="#881337"/>
      <rect x="-16" y="0" width="32" height="30" rx="16" fill="#eab308"/>
      <text x="0" y="-12" font-family="sans-serif" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle">B</text>
      <text x="0" y="18" font-family="sans-serif" font-size="8" font-weight="900" fill="#713f12" text-anchor="middle">Z</text>
    </g>

    <!-- Bottom -->
    <rect x="0" y="265" width="280" height="35" rx="14" fill="#0f172a"/>
    <text x="140" y="287" font-family="sans-serif" font-size="10" font-weight="800" fill="#ca8a04" text-anchor="middle">FOR MOUTH ULCERS &amp; ENERGY RECOVERY</text>
  </g>
</svg>''',

    "telma-40.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <radialGradient id="bgG9" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#fdf4ff"/>
    </radialGradient>
    <filter id="packDropShadow9" x="-10%" y="-10%" width="125%" height="130%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#831843" flood-opacity="0.14" />
    </filter>
  </defs>

  <rect width="400" height="400" fill="url(#bgG9)"/>

  <!-- Telma 40 Glenmark Pack Shot -->
  <g filter="url(#packDropShadow9)" transform="translate(65, 55)">
    <rect x="0" y="0" width="270" height="290" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>

    <!-- Glenmark Magenta Wave -->
    <rect x="0" y="0" width="270" height="18" rx="8" fill="#be185d"/>
    <text x="25" y="45" font-family="sans-serif" font-size="11" font-weight="800" fill="#9d174d" letter-spacing="1">GLENMARK</text>

    <!-- Rx Badge -->
    <rect x="215" y="32" width="35" height="20" rx="4" fill="#fce7f3" stroke="#fbcfe8"/>
    <text x="232" y="46" font-family="sans-serif" font-size="10" font-weight="800" fill="#9d174d" text-anchor="middle">Rx</text>

    <!-- Main Name -->
    <text x="25" y="95" font-family="sans-serif" font-size="28" font-weight="900" fill="#831843">Telma 40</text>
    <text x="25" y="118" font-family="sans-serif" font-size="12" font-weight="700" fill="#475569">Telmisartan Tablets IP 40 mg</text>

    <!-- Glenmark Wave Graphic -->
    <path d="M 25 140 Q 135 170 245 130" stroke="#be185d" stroke-width="4" fill="none" stroke-linecap="round"/>

    <!-- Detail Box -->
    <rect x="25" y="160" width="220" height="70" rx="8" fill="#fdf2f8" stroke="#fbcfe8"/>
    <text x="35" y="180" font-family="sans-serif" font-size="9.5" font-weight="700" fill="#831843">For Treatment of Hypertension</text>
    <text x="35" y="198" font-family="sans-serif" font-size="9" fill="#475569">• 24-Hour Blood Pressure Control</text>
    <text x="35" y="214" font-family="sans-serif" font-size="9" fill="#475569">• 30 Tablets (2 x 15 Strips Alu-Alu)</text>

    <!-- Bottom Strip Indicator -->
    <g transform="translate(25, 245)">
      <rect x="0" y="0" width="220" height="30" rx="6" fill="#f1f5f9" stroke="#cbd5e1"/>
      <circle cx="30" cy="15" r="8" fill="#ffffff" stroke="#94a3b8"/>
      <circle cx="65" cy="15" r="8" fill="#ffffff" stroke="#94a3b8"/>
      <circle cx="100" cy="15" r="8" fill="#ffffff" stroke="#94a3b8"/>
      <circle cx="135" cy="15" r="8" fill="#ffffff" stroke="#94a3b8"/>
      <text x="175" y="19" font-family="sans-serif" font-size="9" font-weight="800" fill="#831843">ALU-ALU</text>
    </g>
  </g>
</svg>''',

    "azithral-500.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <radialGradient id="bgG10" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f0f9ff"/>
    </radialGradient>
    <filter id="packDropShadow10" x="-10%" y="-10%" width="125%" height="130%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#0369a1" flood-opacity="0.14" />
    </filter>
    <radialGradient id="azithralPill" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#e0f2fe"/>
      <stop offset="60%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </radialGradient>
  </defs>

  <rect width="400" height="400" fill="url(#bgG10)"/>

  <!-- Azithral 500 / Azikem 3-Tablet Blister -->
  <g filter="url(#packDropShadow10)" transform="translate(60, 65)">
    <rect x="0" y="0" width="280" height="270" rx="16" fill="#f8fafc" stroke="#bae6fd" stroke-width="2"/>

    <!-- Blue Header Alembic / Alkem -->
    <rect x="0" y="0" width="280" height="58" rx="16" fill="#0284c7"/>
    <text x="20" y="24" font-family="sans-serif" font-size="10" font-weight="800" fill="#e0f2fe" letter-spacing="1">ALEMBIC / ALKEM</text>
    <text x="20" y="48" font-family="sans-serif" font-size="22" font-weight="900" fill="#ffffff" letter-spacing="0.5">Azithral 500</text>
    <text x="200" y="44" font-family="sans-serif" font-size="10" font-weight="800" fill="#e0f2fe">3 TABLETS</text>

    <!-- Subtitle -->
    <rect x="0" y="58" width="280" height="24" fill="#e0f2fe"/>
    <text x="20" y="74" font-family="sans-serif" font-size="9.5" font-weight="700" fill="#0369a1">Azithromycin Tablets IP 500 mg • 3-Day Course</text>

    <!-- 3 Big Oval Tablets Centerpiece -->
    <g transform="translate(140, 115)">
      <ellipse cx="0" cy="0" rx="55" ry="22" fill="url(#azithralPill)" stroke="#0369a1" stroke-width="1.5"/>
      <text x="0" y="4" font-family="sans-serif" font-size="11" font-weight="900" fill="#ffffff" text-anchor="middle">AZITHRAL 500</text>
    </g>
    <g transform="translate(140, 165)">
      <ellipse cx="0" cy="0" rx="55" ry="22" fill="url(#azithralPill)" stroke="#0369a1" stroke-width="1.5"/>
      <text x="0" y="4" font-family="sans-serif" font-size="11" font-weight="900" fill="#ffffff" text-anchor="middle">AZITHRAL 500</text>
    </g>
    <g transform="translate(140, 215)">
      <ellipse cx="0" cy="0" rx="55" ry="22" fill="url(#azithralPill)" stroke="#0369a1" stroke-width="1.5"/>
      <text x="0" y="4" font-family="sans-serif" font-size="11" font-weight="900" fill="#ffffff" text-anchor="middle">AZITHRAL 500</text>
    </g>

    <!-- Footer -->
    <rect x="0" y="245" width="280" height="25" rx="12" fill="#0284c7"/>
    <text x="140" y="261" font-family="sans-serif" font-size="9" font-weight="800" fill="#ffffff" text-anchor="middle">COMPLETE 3-DAY ANTIBIOTIC THERAPY</text>
  </g>
</svg>''',

    "sumo-gel.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <radialGradient id="bgG11" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#fffbeb"/>
    </radialGradient>
    <filter id="packDropShadow11" x="-10%" y="-10%" width="125%" height="130%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#b45309" flood-opacity="0.15" />
    </filter>
  </defs>

  <rect width="400" height="400" fill="url(#bgG11)"/>

  <!-- Sumo Gel Tube -->
  <g filter="url(#packDropShadow11)" transform="translate(140, 40) rotate(12)">
    <rect x="25" y="0" width="40" height="24" rx="4" fill="#b91c1c" stroke="#991b1b"/>
    <path d="M 20 24 L 70 24 L 85 45 L 5 45 Z" fill="#eab308"/>
    <rect x="5" y="45" width="80" height="220" fill="#facc15" stroke="#eab308"/>
    
    <g transform="translate(45, 155) rotate(-90)">
      <text x="0" y="0" font-family="sans-serif" font-size="20" font-weight="900" fill="#b91c1c" text-anchor="middle" letter-spacing="1">SUMO GEL</text>
      <text x="0" y="14" font-family="sans-serif" font-size="8" font-weight="800" fill="#1e293b" text-anchor="middle">DICLOFENAC + LINSEED OIL 30G</text>
    </g>

    <circle cx="45" cy="70" r="14" fill="#b91c1c"/>
    <text x="45" y="74" font-family="sans-serif" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle">+</text>

    <rect x="0" y="265" width="90" height="15" rx="2" fill="#ca8a04"/>
  </g>
</svg>''',

    "omee.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <radialGradient id="bgG12" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f0fdf4"/>
    </radialGradient>
    <filter id="packDropShadow12" x="-10%" y="-10%" width="125%" height="130%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#15803d" flood-opacity="0.14" />
    </filter>
  </defs>

  <rect width="400" height="400" fill="url(#bgG12)"/>

  <!-- Omee 20 Capsules Strip -->
  <g filter="url(#packDropShadow12)" transform="translate(60, 50)">
    <rect x="0" y="0" width="280" height="300" rx="16" fill="#f8fafc" stroke="#86efac" stroke-width="2"/>
    <rect x="0" y="0" width="280" height="58" rx="16" fill="#15803d"/>
    <text x="20" y="24" font-family="sans-serif" font-size="10" font-weight="800" fill="#bbf7d0">ALKEM</text>
    <text x="20" y="48" font-family="sans-serif" font-size="22" font-weight="900" fill="#ffffff">OMEE CAPS</text>
    <text x="190" y="44" font-family="sans-serif" font-size="10" font-weight="700" fill="#bbf7d0">20 CAPSULES</text>

    <rect x="0" y="58" width="280" height="24" fill="#dcfce7"/>
    <text x="20" y="74" font-family="sans-serif" font-size="10" font-weight="700" fill="#166534">Omeprazole Capsules IP 20 mg • Acidity &amp; Gas</text>

    <!-- 2x3 Capsules Green/Clear -->
    <g transform="translate(70, 125)">
      <rect x="-14" y="-28" width="28" height="28" rx="14" fill="#15803d"/>
      <rect x="-14" y="0" width="28" height="28" rx="14" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="0" y="-10" font-family="sans-serif" font-size="7" font-weight="900" fill="#ffffff" text-anchor="middle">20</text>
    </g>
    <g transform="translate(210, 125)">
      <rect x="-14" y="-28" width="28" height="28" rx="14" fill="#15803d"/>
      <rect x="-14" y="0" width="28" height="28" rx="14" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="0" y="-10" font-family="sans-serif" font-size="7" font-weight="900" fill="#ffffff" text-anchor="middle">20</text>
    </g>

    <g transform="translate(70, 205)">
      <rect x="-14" y="-28" width="28" height="28" rx="14" fill="#15803d"/>
      <rect x="-14" y="0" width="28" height="28" rx="14" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="0" y="-10" font-family="sans-serif" font-size="7" font-weight="900" fill="#ffffff" text-anchor="middle">20</text>
    </g>
    <g transform="translate(210, 205)">
      <rect x="-14" y="-28" width="28" height="28" rx="14" fill="#15803d"/>
      <rect x="-14" y="0" width="28" height="28" rx="14" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="0" y="-10" font-family="sans-serif" font-size="7" font-weight="900" fill="#ffffff" text-anchor="middle">20</text>
    </g>

    <rect x="0" y="265" width="280" height="35" rx="14" fill="#15803d"/>
    <text x="140" y="287" font-family="sans-serif" font-size="10" font-weight="800" fill="#ffffff" text-anchor="middle">FAST RELIEF FROM HEARTBURN &amp; ACID REFLUX</text>
  </g>
</svg>''',

    "vicks.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <radialGradient id="bgG13" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f0fdfa"/>
    </radialGradient>
    <filter id="packDropShadow13" x="-10%" y="-10%" width="125%" height="130%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#0f766e" flood-opacity="0.16" />
    </filter>
  </defs>

  <rect width="400" height="400" fill="url(#bgG13)"/>

  <!-- Vicks VapoRub Jar -->
  <g filter="url(#packDropShadow13)" transform="translate(110, 80)">
    <!-- Iconic Green Lid -->
    <rect x="15" y="0" width="150" height="40" rx="8" fill="#15803d" stroke="#166534" stroke-width="2"/>
    <line x1="25" y1="0" x2="25" y2="40" stroke="#86efac" stroke-width="1.5"/>
    <line x1="155" y1="0" x2="155" y2="40" stroke="#166534" stroke-width="1.5"/>

    <!-- Cobalt Blue Jar Body -->
    <path d="M 10 40 L 170 40 L 160 210 L 20 210 Z" fill="#1e3a8a" stroke="#172554" stroke-width="2"/>

    <!-- Yellow Triangular Logo -->
    <polygon points="90,70 135,145 45,145" fill="#facc15" stroke="#eab308" stroke-width="2"/>
    <text x="90" y="125" font-family="sans-serif" font-size="14" font-weight="900" fill="#1e3a8a" text-anchor="middle">VICKS</text>

    <!-- Text -->
    <text x="90" y="170" font-family="sans-serif" font-size="13" font-weight="900" fill="#ffffff" text-anchor="middle">VapoRub</text>
    <text x="90" y="188" font-family="sans-serif" font-size="8" font-weight="700" fill="#93c5fd" text-anchor="middle">Relief from Cold &amp; Cough</text>
  </g>
</svg>''',

    "benadryl.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <radialGradient id="bgG14" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#fff1f2"/>
    </radialGradient>
    <filter id="packDropShadow14" x="-10%" y="-10%" width="125%" height="130%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#9f1239" flood-opacity="0.14" />
    </filter>
  </defs>

  <rect width="400" height="400" fill="url(#bgG14)"/>

  <!-- Benadryl Syrup Bottle -->
  <g filter="url(#packDropShadow14)" transform="translate(125, 45)">
    <!-- White Cap with Measure Cup -->
    <rect x="40" y="0" width="70" height="35" rx="6" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
    <line x1="50" y1="20" x2="65" y2="20" stroke="#94a3b8" stroke-width="1.5"/>
    <text x="75" y="23" font-family="sans-serif" font-size="7" font-weight="700" fill="#64748b">10 ml</text>

    <!-- Amber Bottle Neck -->
    <rect x="52" y="35" width="46" height="25" fill="#78350f"/>

    <!-- Amber Bottle Body -->
    <rect x="15" y="60" width="120" height="240" rx="20" fill="#92400e" stroke="#78350f" stroke-width="2"/>

    <!-- Red Benadryl Label -->
    <rect x="22" y="90" width="106" height="175" rx="8" fill="#be123c"/>
    <text x="75" y="125" font-family="sans-serif" font-size="16" font-weight="900" fill="#ffffff" text-anchor="middle">Benadryl</text>
    <text x="75" y="145" font-family="sans-serif" font-size="9" font-weight="800" fill="#fecdd3" text-anchor="middle">COUGH FORMULA</text>
    <line x1="35" y1="155" x2="115" y2="155" stroke="#fda4af" stroke-width="1"/>
    <text x="75" y="175" font-family="sans-serif" font-size="8" font-weight="700" fill="#ffffff" text-anchor="middle">Diphenhydramine HCl</text>
    <text x="75" y="190" font-family="sans-serif" font-size="8" font-weight="700" fill="#ffffff" text-anchor="middle">Ammonium Chloride</text>
    <text x="75" y="240" font-family="sans-serif" font-size="10" font-weight="900" fill="#fef08a" text-anchor="middle">100 ml</text>
  </g>
</svg>''',

    "disprin.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <radialGradient id="bgG15" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#eff6ff"/>
    </radialGradient>
    <filter id="packDropShadow15" x="-10%" y="-10%" width="125%" height="130%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#1e3a8a" flood-opacity="0.14" />
    </filter>
  </defs>

  <rect width="400" height="400" fill="url(#bgG15)"/>

  <!-- Disprin Strip -->
  <g filter="url(#packDropShadow15)" transform="translate(60, 65)">
    <rect x="0" y="0" width="280" height="270" rx="16" fill="#ffffff" stroke="#93c5fd" stroke-width="2"/>
    <rect x="0" y="0" width="280" height="58" rx="16" fill="#1e40af"/>
    <text x="20" y="24" font-family="sans-serif" font-size="10" font-weight="800" fill="#bfdbfe">RECKITT</text>
    <text x="20" y="48" font-family="sans-serif" font-size="22" font-weight="900" fill="#ffffff">DISPRIN</text>
    <text x="200" y="44" font-family="sans-serif" font-size="10" font-weight="700" fill="#bfdbfe">10 TABLETS</text>

    <rect x="0" y="58" width="280" height="24" fill="#dbeafe"/>
    <text x="20" y="74" font-family="sans-serif" font-size="10" font-weight="700" fill="#1e3a8a">Soluble Aspirin Tablets IP 350 mg • Fast Dissolve</text>

    <!-- White Round Effervescent Tablets -->
    <g transform="translate(70, 130)">
      <circle cx="0" cy="0" r="28" fill="#ffffff" stroke="#93c5fd" stroke-width="2"/>
      <text x="0" y="4" font-family="sans-serif" font-size="8" font-weight="900" fill="#1e40af" text-anchor="middle">DISPRIN</text>
    </g>
    <g transform="translate(210, 130)">
      <circle cx="0" cy="0" r="28" fill="#ffffff" stroke="#93c5fd" stroke-width="2"/>
      <text x="0" y="4" font-family="sans-serif" font-size="8" font-weight="900" fill="#1e40af" text-anchor="middle">DISPRIN</text>
    </g>
    <g transform="translate(70, 200)">
      <circle cx="0" cy="0" r="28" fill="#ffffff" stroke="#93c5fd" stroke-width="2"/>
      <text x="0" y="4" font-family="sans-serif" font-size="8" font-weight="900" fill="#1e40af" text-anchor="middle">DISPRIN</text>
    </g>
    <g transform="translate(210, 200)">
      <circle cx="0" cy="0" r="28" fill="#ffffff" stroke="#93c5fd" stroke-width="2"/>
      <text x="0" y="4" font-family="sans-serif" font-size="8" font-weight="900" fill="#1e40af" text-anchor="middle">DISPRIN</text>
    </g>

    <rect x="0" y="245" width="280" height="25" rx="12" fill="#1e40af"/>
    <text x="140" y="261" font-family="sans-serif" font-size="9" font-weight="800" fill="#ffffff" text-anchor="middle">FAST RELIEF FROM HEADACHES &amp; FEVER</text>
  </g>
</svg>''',

    "okacet.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <radialGradient id="bgG16" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f0fdfa"/>
    </radialGradient>
    <filter id="packDropShadow16" x="-10%" y="-10%" width="125%" height="130%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#0f766e" flood-opacity="0.14" />
    </filter>
  </defs>

  <rect width="400" height="400" fill="url(#bgG16)"/>

  <!-- Okacet Cipla Strip -->
  <g filter="url(#packDropShadow16)" transform="translate(60, 65)">
    <rect x="0" y="0" width="280" height="270" rx="16" fill="#f8fafc" stroke="#99f6e4" stroke-width="2"/>
    <rect x="0" y="0" width="280" height="58" rx="16" fill="#0f766e"/>
    <text x="20" y="24" font-family="sans-serif" font-size="10" font-weight="800" fill="#ccfbf1">CIPLA</text>
    <text x="20" y="48" font-family="sans-serif" font-size="22" font-weight="900" fill="#ffffff">OKACET 10MG</text>
    <text x="200" y="44" font-family="sans-serif" font-size="10" font-weight="700" fill="#ccfbf1">10 TABLETS</text>

    <rect x="0" y="58" width="280" height="24" fill="#ccfbf1"/>
    <text x="20" y="74" font-family="sans-serif" font-size="10" font-weight="700" fill="#115e59">Cetirizine Hydrochloride Tablets IP 10 mg • Anti-Allergy</text>

    <!-- Small White Scored Tablets -->
    <g transform="translate(70, 130)">
      <circle cx="0" cy="0" r="22" fill="#ffffff" stroke="#14b8a6" stroke-width="1.5"/>
      <line x1="-14" y1="0" x2="14" y2="0" stroke="#0d9488" stroke-width="1.5"/>
      <text x="0" y="-4" font-family="sans-serif" font-size="6.5" font-weight="900" fill="#0f766e" text-anchor="middle">OKACET</text>
      <text x="0" y="9" font-family="sans-serif" font-size="6.5" font-weight="900" fill="#0f766e" text-anchor="middle">10</text>
    </g>
    <g transform="translate(210, 130)">
      <circle cx="0" cy="0" r="22" fill="#ffffff" stroke="#14b8a6" stroke-width="1.5"/>
      <line x1="-14" y1="0" x2="14" y2="0" stroke="#0d9488" stroke-width="1.5"/>
      <text x="0" y="-4" font-family="sans-serif" font-size="6.5" font-weight="900" fill="#0f766e" text-anchor="middle">OKACET</text>
      <text x="0" y="9" font-family="sans-serif" font-size="6.5" font-weight="900" fill="#0f766e" text-anchor="middle">10</text>
    </g>
    <g transform="translate(70, 200)">
      <circle cx="0" cy="0" r="22" fill="#ffffff" stroke="#14b8a6" stroke-width="1.5"/>
      <line x1="-14" y1="0" x2="14" y2="0" stroke="#0d9488" stroke-width="1.5"/>
      <text x="0" y="-4" font-family="sans-serif" font-size="6.5" font-weight="900" fill="#0f766e" text-anchor="middle">OKACET</text>
      <text x="0" y="9" font-family="sans-serif" font-size="6.5" font-weight="900" fill="#0f766e" text-anchor="middle">10</text>
    </g>
    <g transform="translate(210, 200)">
      <circle cx="0" cy="0" r="22" fill="#ffffff" stroke="#14b8a6" stroke-width="1.5"/>
      <line x1="-14" y1="0" x2="14" y2="0" stroke="#0d9488" stroke-width="1.5"/>
      <text x="0" y="-4" font-family="sans-serif" font-size="6.5" font-weight="900" fill="#0f766e" text-anchor="middle">OKACET</text>
      <text x="0" y="9" font-family="sans-serif" font-size="6.5" font-weight="900" fill="#0f766e" text-anchor="middle">10</text>
    </g>

    <rect x="0" y="245" width="280" height="25" rx="12" fill="#0f766e"/>
    <text x="140" y="261" font-family="sans-serif" font-size="9" font-weight="800" fill="#ffffff" text-anchor="middle">24HR ALLERGY, SNEEZING &amp; RUNNY NOSE RELIEF</text>
  </g>
</svg>''',

    "cheston-cold.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <radialGradient id="bgG17" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#eff6ff"/>
    </radialGradient>
    <filter id="packDropShadow17" x="-10%" y="-10%" width="125%" height="130%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#1e3a8a" flood-opacity="0.14" />
    </filter>
  </defs>

  <rect width="400" height="400" fill="url(#bgG17)"/>

  <!-- Cheston Cold Strip -->
  <g filter="url(#packDropShadow17)" transform="translate(60, 65)">
    <rect x="0" y="0" width="280" height="270" rx="16" fill="#f8fafc" stroke="#93c5fd" stroke-width="2"/>
    <rect x="0" y="0" width="280" height="58" rx="16" fill="#ea580c"/>
    <text x="20" y="24" font-family="sans-serif" font-size="10" font-weight="800" fill="#ffedd5">CIPLA</text>
    <text x="20" y="48" font-family="sans-serif" font-size="20" font-weight="900" fill="#ffffff">CHESTON COLD</text>
    <text x="200" y="44" font-family="sans-serif" font-size="10" font-weight="700" fill="#ffedd5">10 TABLETS</text>

    <rect x="0" y="58" width="280" height="24" fill="#ffedd5"/>
    <text x="20" y="74" font-family="sans-serif" font-size="9.5" font-weight="700" fill="#9a3412">Paracetamol, Cetirizine &amp; Phenylephrine Tablets</text>

    <!-- White Tablets with Blue/Orange blister pockets -->
    <g transform="translate(70, 130)">
      <circle cx="0" cy="0" r="24" fill="#ffffff" stroke="#ea580c" stroke-width="1.5"/>
      <text x="0" y="4" font-family="sans-serif" font-size="8" font-weight="900" fill="#ea580c" text-anchor="middle">CHESTON</text>
    </g>
    <g transform="translate(210, 130)">
      <circle cx="0" cy="0" r="24" fill="#ffffff" stroke="#ea580c" stroke-width="1.5"/>
      <text x="0" y="4" font-family="sans-serif" font-size="8" font-weight="900" fill="#ea580c" text-anchor="middle">CHESTON</text>
    </g>
    <g transform="translate(70, 200)">
      <circle cx="0" cy="0" r="24" fill="#ffffff" stroke="#ea580c" stroke-width="1.5"/>
      <text x="0" y="4" font-family="sans-serif" font-size="8" font-weight="900" fill="#ea580c" text-anchor="middle">CHESTON</text>
    </g>
    <g transform="translate(210, 200)">
      <circle cx="0" cy="0" r="24" fill="#ffffff" stroke="#ea580c" stroke-width="1.5"/>
      <text x="0" y="4" font-family="sans-serif" font-size="8" font-weight="900" fill="#ea580c" text-anchor="middle">CHESTON</text>
    </g>

    <rect x="0" y="245" width="280" height="25" rx="12" fill="#ea580c"/>
    <text x="140" y="261" font-family="sans-serif" font-size="9" font-weight="800" fill="#ffffff" text-anchor="middle">TRIPLE ACTION COLD, FEVER &amp; CONGESTION RELIEF</text>
  </g>
</svg>''',

    "safi.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <radialGradient id="bgG18" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f0fdf4"/>
    </radialGradient>
    <filter id="packDropShadow18" x="-10%" y="-10%" width="125%" height="130%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#14532d" flood-opacity="0.16" />
    </filter>
  </defs>

  <rect width="400" height="400" fill="url(#bgG18)"/>

  <!-- Hamdard Saafi Herbal Tonic Bottle -->
  <g filter="url(#packDropShadow18)" transform="translate(130, 45)">
    <rect x="40" y="0" width="60" height="30" rx="4" fill="#15803d" stroke="#14532d" stroke-width="2"/>
    <rect x="50" y="30" width="40" height="25" fill="#14532d"/>
    <rect x="15" y="55" width="110" height="245" rx="18" fill="#064e3b" stroke="#022c22" stroke-width="2"/>

    <!-- Green & Gold Label -->
    <rect x="22" y="85" width="96" height="180" rx="8" fill="#15803d"/>
    <text x="70" y="115" font-family="sans-serif" font-size="11" font-weight="800" fill="#fef08a" text-anchor="middle">HAMDARD</text>
    <text x="70" y="145" font-family="sans-serif" font-size="24" font-weight="900" fill="#ffffff" text-anchor="middle">SAFI</text>
    <text x="70" y="165" font-family="sans-serif" font-size="8.5" font-weight="800" fill="#fef08a" text-anchor="middle">THE BLOOD PURIFIER</text>
    <line x1="30" y1="175" x2="110" y2="175" stroke="#fef08a" stroke-width="1"/>
    <text x="70" y="195" font-family="sans-serif" font-size="8" fill="#ffffff" text-anchor="middle">Neem, Chirata, Senna</text>
    <text x="70" y="210" font-family="sans-serif" font-size="8" fill="#ffffff" text-anchor="middle">&amp; 28 Essential Herbs</text>
    <text x="70" y="245" font-family="sans-serif" font-size="11" font-weight="900" fill="#fef08a" text-anchor="middle">100 ml</text>
  </g>
</svg>''',

    "skinshine.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <radialGradient id="bgG19" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#fff1f2"/>
    </radialGradient>
    <filter id="packDropShadow19" x="-10%" y="-10%" width="125%" height="130%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#db2777" flood-opacity="0.14" />
    </filter>
  </defs>

  <rect width="400" height="400" fill="url(#bgG19)"/>

  <!-- Skinshine Cream Tube -->
  <g filter="url(#packDropShadow19)" transform="translate(140, 40) rotate(-12)">
    <rect x="25" y="0" width="40" height="24" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
    <path d="M 20 24 L 70 24 L 85 45 L 5 45 Z" fill="#f43f5e"/>
    <rect x="5" y="45" width="80" height="220" fill="#ffffff" stroke="#f43f5e" stroke-width="1.5"/>

    <!-- Pink Gradient Accent -->
    <rect x="5" y="70" width="80" height="35" fill="#f43f5e"/>
    <text x="45" y="92" font-family="sans-serif" font-size="8" font-weight="800" fill="#ffffff" text-anchor="middle">CADILA</text>

    <g transform="translate(45, 160) rotate(-90)">
      <text x="0" y="0" font-family="sans-serif" font-size="18" font-weight="900" fill="#be123c" text-anchor="middle">SKINSHINE</text>
      <text x="0" y="14" font-family="sans-serif" font-size="8" font-weight="700" fill="#475569" text-anchor="middle">Hydroquinone, Tretinoin Cream 15g</text>
    </g>

    <rect x="0" y="265" width="90" height="15" rx="2" fill="#e11d48"/>
  </g>
</svg>''',

    "omnigel.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <radialGradient id="bgG20" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </radialGradient>
    <filter id="packDropShadow20" x="-10%" y="-10%" width="125%" height="130%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#1e3a8a" flood-opacity="0.14" />
    </filter>
  </defs>

  <rect width="400" height="400" fill="url(#bgG20)"/>

  <!-- Omnigel Pain Relief Tube -->
  <g filter="url(#packDropShadow20)" transform="translate(140, 40) rotate(14)">
    <rect x="25" y="0" width="40" height="24" rx="4" fill="#dc2626" stroke="#b91c1c"/>
    <path d="M 20 24 L 70 24 L 85 45 L 5 45 Z" fill="#1e3a8a"/>
    <rect x="5" y="45" width="80" height="220" fill="#1e3a8a" stroke="#172554"/>

    <!-- Red Action Wave -->
    <path d="M 5 110 Q 45 135 85 110 L 85 160 Q 45 185 5 160 Z" fill="#dc2626"/>

    <g transform="translate(45, 160) rotate(-90)">
      <text x="0" y="0" font-family="sans-serif" font-size="19" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">OMNIGEL</text>
      <text x="0" y="14" font-family="sans-serif" font-size="7.5" font-weight="800" fill="#fecaca" text-anchor="middle">CIPLA HEALTH • 30G</text>
    </g>

    <circle cx="45" cy="75" r="14" fill="#ffffff"/>
    <text x="45" y="78" font-family="sans-serif" font-size="7" font-weight="900" fill="#dc2626" text-anchor="middle">EXPERT</text>

    <rect x="0" y="265" width="90" height="15" rx="2" fill="#172554"/>
  </g>
</svg>''',
}

count = 0
for filename, content in PACK_SHOTS.items():
    filepath = os.path.join(OUT_DIR, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content.strip())
    count += 1

print(f"Successfully generated {count} authentic brand pack shot SVGs in {OUT_DIR}")

