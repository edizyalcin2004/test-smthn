---
name: Quiet Luxury Fintech
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e3'
  on-surface: '#1a1c1c'
  on-surface-variant: '#41484a'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#71787a'
  outline-variant: '#c1c8c9'
  surface-tint: '#3e646c'
  primary: '#00181c'
  on-primary: '#ffffff'
  primary-container: '#002e35'
  on-primary-container: '#70969f'
  inverse-primary: '#a6cdd6'
  secondary: '#006972'
  on-secondary: '#ffffff'
  secondary-container: '#9eecf6'
  on-secondary-container: '#0c6d76'
  tertiary: '#251000'
  on-tertiary: '#ffffff'
  tertiary-container: '#3e2309'
  on-tertiary-container: '#b18866'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c1e9f2'
  primary-fixed-dim: '#a6cdd6'
  on-primary-fixed: '#001f25'
  on-primary-fixed-variant: '#254c54'
  secondary-fixed: '#a1eff9'
  secondary-fixed-dim: '#85d3dd'
  on-secondary-fixed: '#001f23'
  on-secondary-fixed-variant: '#004f56'
  tertiary-fixed: '#ffdcc2'
  tertiary-fixed-dim: '#ecbd98'
  on-tertiary-fixed: '#2e1501'
  on-tertiary-fixed-variant: '#604023'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e3'
typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.7'
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  container-max-width: 1200px
---

## Brand & Style
The design system embodies the "Quiet Luxury" aesthetic—a philosophy of understated wealth, high-craft precision, and technical excellence. It is designed for high-net-worth individuals and professionals who value clarity over clutter. 

The visual direction merges **Swiss Typography Precision** with **Modern Glassmorphism**. The layout is airy and expansive, utilizing generous whitespace to signal premium quality. Interactivity is subtle but tactile, utilizing soft transitions and multi-layered surfaces to create a sense of physical depth. The tone is authoritative, reliable, and sophisticated.

## Colors
The palette is rooted in "Pearl" neutrals and "Deep Teal" primaries to evoke stability and exclusivity. We use a hierarchical surface system to define depth without relying solely on shadows.

- **Primary Tones:** The Deep Teal (#002E35) is the anchor, used for core actions and brand moments.
- **Surface Strategy:** Use `surface_lowest` (Pure White) for the most elevated interactive cards. The background (#F8F9FA) acts as the base canvas.
- **Accents:** Platform-specific accents (e.g., Trendyol Orange, Getir Purple) should be used sparingly as semantic identifiers for third-party integrations, ensuring they don't overpower the core brand's muted elegance.

## Typography
The typography system relies on the interplay between the geometric structure of **Manrope** for headers and the utilitarian clarity of **Inter** for functional text.

- **Headers:** Always use tight letter-spacing (-0.02em) to maintain a "locked-in" Swiss look.
- **Body:** Prioritize legibility with a generous line-height (1.6 to 1.7). This adds to the "Quiet Luxury" feel by giving words room to breathe.
- **Labels:** Small labels are set in uppercase with increased tracking (0.05em) to differentiate them clearly from body content and provide a technical, architectural feel.

## Layout & Spacing
The layout follows a strict 8px rhythm. Precision is key; elements should feel aligned to an invisible, rigorous grid.

- **Grid:** Use a 12-column fixed grid for desktop (max-width 1200px) and a fluid 4-column grid for mobile.
- **Padding:** High-end "Luxury Cards" must utilize a 32px (4x) internal padding to signal premium space.
- **Rhythm:** Vertical rhythm should be consistent. Use 48px or 64px gaps between major sections to maintain the minimalist aesthetic.

## Elevation & Depth
Depth is communicated through **Glassmorphism** and subtle tonal shifts rather than heavy shadows.

- **Glass Panels:** Navigation bars and floating menus use a semi-transparent white (80% opacity) with a 16px backdrop blur. This allows content to scroll "under" the UI, creating a modern sense of layering.
- **Inner Strokes:** Elevated cards use a 1px internal white stroke (`rgba(255, 255, 255, 0.5)`) on their top edge to simulate a light source catching the "rim" of the surface.
- **Shadows:** Use extremely soft, multi-layered shadows for floating elements. Avoid harsh black shadows; use low-opacity tinted neutrals to keep the look clean and professional.

## Shapes
The shape language is sophisticated, avoiding the overly-round "bubbly" look of consumer social apps in favor of more structured, architectural corners.

- **Buttons & Inputs:** Fixed at 8px. This provides enough softness to be modern while retaining a professional, geometric edge.
- **Cards:** Use 12px for standard containers and 16px for large, featured dashboards.
- **Chips:** Fully pill-shaped to differentiate them as discrete, removable, or filterable elements within the more rectangular layout.

## Components
- **Primary Buttons:** Styled with a subtle vertical gradient from `Primary Container` (#00464f) to `Primary` (#002e35). Text is white or `On-Primary-Container`.
- **Luxury Cards:** Defined by 32px padding, a 1px border (`outline_variant`), and a subtle white inner stroke. Background should be `surface_lowest`.
- **Glass Navigation:** Top and bottom bars use the glass effect (80% opacity, 16px blur). Top bars have a 1px bottom border; bottom bars have a 1px top border in `outline_variant`.
- **Input Fields:** 8px corner radius, 1px `outline` border. On focus, the border thickens to 2px using the `Secondary` color.
- **Icons:** Use **Material Symbols Outlined**. Stroke weight should be light (200-300) to match the refined typography.
- **Chips:** High-contrast background (either `Primary` for selected or `Surface Variant` for unselected) with 12px `label-sm` text.