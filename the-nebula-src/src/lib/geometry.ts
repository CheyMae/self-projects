// One shared description of where the planet and its orbits sit, so the
// persistent <Cosmos> layer and each page's nodes always line up — and so the
// planet can glide between the Welcome (centred) and Home (left) positions.

export type CosmosMode = 'welcome' | 'home' | 'hidden'

export interface Geometry {
  mode: CosmosMode
  compact: boolean
  /** Planet centre, in page pixels from the top-left of the app. */
  cx: number
  cy: number
  /** Radius of the main gold orbit ring (where nodes sit). */
  r: number
  rings: { drift: number; dashed: number; halo: number; disc: number }
  /** Diameter of the orbit nodes. */
  node: number
  /** Scale applied to page content laid out in design pixels. */
  scale: number
}

export const WELCOME_COMPACT_BELOW = 700
export const HOME_COMPACT_BELOW = 1000

export function geometry(mode: CosmosMode, w: number, h: number): Geometry {
  if (mode === 'home' || mode === 'hidden') {
    if (w < HOME_COMPACT_BELOW) {
      // Mobile Home (Figma: 390 wide, planet centre (-50, 470), ring r = 280)
      const k = Math.min(w / 390, 1.6)
      return {
        mode,
        compact: true,
        cx: -50 * k,
        cy: 470 * k,
        r: 280 * k,
        rings: { drift: 440 * k, dashed: 383 * k, halo: 254 * k, disc: 240 * k },
        node: 48,
        scale: k,
      }
    }
    // Desktop Home (Figma: 1440×900, planet centre (140, 450), ring r = 420)
    const s = Math.min(1, h / 900)
    return {
      mode,
      compact: false,
      cx: 140 * s,
      cy: h / 2,
      r: 420 * s,
      rings: { drift: 660 * s, dashed: 575 * s, halo: 374 * s, disc: 360 * s },
      node: 64,
      scale: s,
    }
  }

  if (w < WELCOME_COMPACT_BELOW) {
    // Mobile Welcome (Figma: 390×844, ring 320 centred at (195, 330))
    const k = Math.min(w / 390, h / 760, 1.4)
    return {
      mode,
      compact: true,
      cx: w / 2,
      cy: 330 * k,
      r: 160 * k,
      rings: { drift: 320 * k, dashed: 140 * k, halo: 123 * k, disc: 115 * k },
      node: 44,
      scale: k,
    }
  }
  // Desktop Welcome (Figma: ring 760 centred on the page)
  const r = Math.min(380, h * 0.42, w * 0.46)
  return {
    mode,
    compact: false,
    cx: w / 2,
    cy: h / 2,
    r,
    rings: { drift: r * 1.553, dashed: r * 0.863, halo: r * 0.721, disc: r * 0.684 },
    node: 56,
    scale: r / 380,
  }
}

/** Point on the orbit at `deg` degrees (0 = right, clockwise). */
export function onOrbit(g: Geometry, deg: number) {
  const rad = (deg * Math.PI) / 180
  return { x: g.cx + g.r * Math.cos(rad), y: g.cy + g.r * Math.sin(rad) }
}
