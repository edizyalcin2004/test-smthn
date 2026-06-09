---
name: High-Craft Professional
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#40484a'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#70797a'
  outline-variant: '#bfc8ca'
  surface-tint: '#2e666f'
  primary: '#002e35'
  on-primary: '#ffffff'
  primary-container: '#00464f'
  on-primary-container: '#7db3bd'
  inverse-primary: '#99d0da'
  secondary: '#006972'
  on-secondary: '#ffffff'
  secondary-container: '#8feefc'
  on-secondary-container: '#006d77'
  tertiary: '#1c2c2c'
  on-tertiary: '#ffffff'
  tertiary-container: '#324242'
  on-tertiary-container: '#9daead'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b4ecf7'
  primary-fixed-dim: '#99d0da'
  on-primary-fixed: '#001f24'
  on-primary-fixed-variant: '#0f4e57'
  secondary-fixed: '#92f1fe'
  secondary-fixed-dim: '#75d5e2'
  on-secondary-fixed: '#001f23'
  on-secondary-fixed-variant: '#004f56'
  tertiary-fixed: '#d4e6e5'
  tertiary-fixed-dim: '#b8cac9'
  on-tertiary-fixed: '#0e1e1e'
  on-tertiary-fixed-variant: '#3a4a49'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
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
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-padding-dt: 40px
  container-padding-mb: 20px
  gutter: 24px
  card-padding: 32px
  stack-sm: 12px
  stack-md: 24px
---

## Brand & Style
The design system is engineered for high-end fintech and concierge-level services. It evokes a sense of "quiet luxury"—combining the precision of Swiss typography with the tactile depth of modern glassmorphism. The brand personality is authoritative yet approachable, focusing on the "high-craft" detail: 1px strokes, multi-layered shadows, and expansive whitespace.

The visual style is a hybrid of **Minimalism** and **Glassmorphism**. It avoids the sterility of flat design by using translucent layers and background blurs to establish a clear spatial hierarchy. The target audience expects a "premium digital workspace" that feels both physically substantial and digitally fluid, akin to a high-end banking app or an executive dashboard.

## Colors
The palette is anchored by the signature Deep Teal, representing stability and depth. To achieve the "High-Craft" aesthetic, we move away from stark whites in favor of **Pearl** and **Soft Slate** neutrals. These off-white surfaces reduce eye strain and provide a more sophisticated backdrop for translucent elements.

Gradients are used sparingly but effectively for interactive states and status badges. Rather than flat platform colors, badges utilize subtle linear gradients (e.g., a 10% shift in hue) to create a "jewel-like" quality. Primary actions utilize the Deep Teal, while secondary surfaces use varying "weights" of slate to denote information hierarchy.

## Typography
The typographic system relies on the contrast between the characterful **Manrope** and the utilitarian **Inter**. Headlines are set with tight letter-spacing and heavy weights to create a "locked-in" professional look. 

Body copy uses Inter with a generous line-height (1.6x to 1.7x) to ensure maximum readability in data-dense environments. Micro-copy and labels use uppercase Inter with increased letter-spacing to provide a secondary layer of hierarchy that feels architectural and deliberate.

## Layout & Spacing
This design system utilizes a **Fixed Grid** model for desktop (1280px max-width) and a **Fluid Grid** for mobile. The rhythm is based on an 8px base unit, but emphasizes "luxury of space"—using larger-than-standard margins to prevent the UI from feeling cluttered.

On desktop, the layout utilizes a 12-column grid with 24px gutters. For mobile, a 4-column grid is used with 20px side margins. Components like cards and modals use "Stack" spacing (12px or 24px) to group related information clusters logically, ensuring a clear vertical rhythm.

## Elevation & Depth
Depth is the cornerstone of this system. We utilize **Tonal Layers** combined with **Glassmorphism** to create a sophisticated environment.

- **The Glass Effect:** Surfaces (cards, navigation bars) use a 16px to 24px backdrop blur with a semi-transparent background color (`rgba(252, 252, 253, 0.8)`).
- **Inner Borders:** Every card and modal features a "light-on-light" 1px inner border. For light mode, this is a white or high-transparency stroke that creates a "beveled edge" look.
- **Shadows:** We avoid heavy black shadows. Instead, we use multi-layered ambient shadows: a very soft, large-radius blur for the "glow" and a tighter, slightly darker blur for the "contact" shadow. This makes elements appear to float elegantly above the pearl-toned surfaces.

## Shapes
Shapes are defined by "Rounded" corners (0.5rem base), which strike a balance between friendly and corporate. Large containers, such as main dashboard cards, utilize `rounded-lg` (1rem) to soften the overall visual density. Smaller elements like input fields and buttons stay consistent with the 0.5rem base to maintain a structured, professional appearance.

## Components
- **Cards:** The hallmark of the system. Cards feature 32px padding, a 1px inner stroke, and 24px backdrop blur. Metadata within cards should use "micro-details"—tiny 12px icons paired with 12px uppercase labels.
- **Buttons:** Primary buttons are Deep Teal with a subtle top-down gradient. They feature high-contrast white text. Secondary buttons are "ghost" style with the 1px inner border technique.
- **Input Fields:** Fields use the "Pearl" background with a 1px Slate border that transitions to Deep Teal on focus.
- **Chips & Badges:** These are pill-shaped and use a very subtle linear gradient. They should have enough padding to feel "airy"—typically 4px vertical and 12px horizontal.
- **Lists:** List items are separated by subtle 1px slate lines. Hover states should trigger a slight background color shift to Pearl or a very subtle lift using the ambient shadow system.
- **Metadata:** Use 12px Inter Bold for labels with 0.05em tracking to differentiate from standard body text.