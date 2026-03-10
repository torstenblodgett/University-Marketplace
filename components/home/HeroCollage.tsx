/**
 * HeroCollage
 *
 * Purely decorative SVG silhouettes placed as an extremely subtle
 * watermark-style backdrop behind the hero section.
 *
 * Design rules:
 *  - All items render at 9 % opacity — subtly visible, never competing with text
 *  - Single flat colour (#1A1A1A) so shapes are inherently desaturated
 *  - pointer-events-none + aria-hidden so the layer is invisible to AT and clicks
 *  - 6 items on ≥sm viewports; only 2 corner items on mobile
 */

function LaptopSVG() {
  return (
    <svg
      viewBox="0 0 140 90"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Screen body */}
      <rect x="10" y="0" width="120" height="76" rx="6" />
      {/* Keyboard base — slightly wider than screen */}
      <rect x="0" y="80" width="140" height="10" rx="3" />
    </svg>
  )
}

function TextbookSVG() {
  return (
    <svg
      viewBox="0 0 85 100"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Second book peeking behind */}
      <rect x="8" y="10" width="72" height="90" rx="3" />
      {/* Front cover */}
      <rect x="0" y="0" width="72" height="90" rx="3" />
      {/* Spine band */}
      <rect x="0" y="0" width="10" height="90" rx="2" />
    </svg>
  )
}

function ChairSVG() {
  return (
    <svg
      viewBox="0 0 90 115"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Back rest */}
      <rect x="10" y="0" width="70" height="54" rx="6" />
      {/* Seat */}
      <rect x="5" y="58" width="80" height="14" rx="4" />
      {/* Front-left leg */}
      <rect x="11" y="72" width="11" height="43" rx="3" />
      {/* Front-right leg */}
      <rect x="68" y="72" width="11" height="43" rx="3" />
    </svg>
  )
}

function WinterJacketSVG() {
  return (
    <svg
      viewBox="0 0 112 130"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Body */}
      <path d="M30 38 L82 38 L90 130 L22 130 Z" />
      {/* Left sleeve */}
      <path d="M4 44 L30 38 L24 94 L2 88 Z" />
      {/* Right sleeve */}
      <path d="M82 38 L108 44 L110 88 L88 94 Z" />
      {/* Left collar / lapel */}
      <path d="M30 38 L46 4 L56 38 Z" />
      {/* Right collar / lapel */}
      <path d="M56 38 L66 4 L82 38 Z" />
    </svg>
  )
}

function BikeSVG() {
  return (
    <svg
      viewBox="0 0 175 115"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Left wheel */}
      <circle cx="37" cy="73" r="36" />
      {/* Right wheel */}
      <circle cx="138" cy="73" r="36" />
      {/* Frame triangle */}
      <polygon points="37,73 88,26 138,73" />
      {/* Seat post */}
      <rect x="82" y="12" width="12" height="16" rx="3" />
      {/* Saddle */}
      <rect x="66" y="9" width="44" height="9" rx="4" />
      {/* Handlebar stem */}
      <rect x="132" y="28" width="10" height="22" rx="3" />
      {/* Handlebars */}
      <rect x="118" y="26" width="38" height="8" rx="4" />
    </svg>
  )
}

function DeskLampSVG() {
  return (
    <svg
      viewBox="0 0 100 150"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Base */}
      <rect x="20" y="134" width="60" height="16" rx="5" />
      {/* Vertical pole */}
      <rect x="45" y="78" width="10" height="58" rx="4" />
      {/* Diagonal arm (parallelogram) */}
      <path d="M43 82 L53 78 L76 36 L66 40 Z" />
      {/* Shade */}
      <polygon points="18,20 82,20 68,52 32,52" />
    </svg>
  )
}

export function HeroCollage() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {/*
       * MOBILE (< sm): only two corner items so they never crowd the
       * centred hero text on a narrow viewport.
       *
       * DESKTOP (≥ sm): all six items visible.
       */}

      {/* Textbook — top-left, always visible */}
      <div
        className="absolute left-3 top-4 w-16 text-[#1A1A1A] opacity-[0.09] sm:w-20"
        style={{ transform: 'rotate(-8deg)' }}
      >
        <TextbookSVG />
      </div>

      {/* Chair — top-right, always visible */}
      <div
        className="absolute right-3 top-3 w-14 text-[#1A1A1A] opacity-[0.09] sm:w-24"
        style={{ transform: 'rotate(7deg)' }}
      >
        <ChairSVG />
      </div>

      {/* Laptop — upper centre-left, desktop only */}
      <div
        className="absolute left-[26%] top-8 hidden w-28 text-[#1A1A1A] opacity-[0.09] sm:block"
        style={{ transform: 'rotate(5deg)' }}
      >
        <LaptopSVG />
      </div>

      {/* Winter jacket — bottom-left, desktop only */}
      <div
        className="absolute bottom-4 left-5 hidden w-24 text-[#1A1A1A] opacity-[0.09] sm:block"
        style={{ transform: 'rotate(-6deg)' }}
      >
        <WinterJacketSVG />
      </div>

      {/* Bike — bottom-right, desktop only */}
      <div
        className="absolute bottom-3 right-4 hidden w-36 text-[#1A1A1A] opacity-[0.09] sm:block"
        style={{ transform: 'rotate(4deg)' }}
      >
        <BikeSVG />
      </div>

      {/* Desk lamp — lower centre-right, desktop only */}
      <div
        className="absolute bottom-6 right-[24%] hidden w-20 text-[#1A1A1A] opacity-[0.09] sm:block"
        style={{ transform: 'rotate(-11deg)' }}
      >
        <DeskLampSVG />
      </div>
    </div>
  )
}
