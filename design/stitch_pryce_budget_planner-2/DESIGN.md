---
name: Pryce Design System
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
  on-surface-variant: '#41484a'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#71787a'
  outline-variant: '#c1c8c9'
  surface-tint: '#3e646c'
  primary: '#00181c'
  on-primary: '#ffffff'
  primary-container: '#002e35'
  on-primary-container: '#70969f'
  inverse-primary: '#a6cdd6'
  secondary: '#755a26'
  on-secondary: '#ffffff'
  secondary-container: '#fdd798'
  on-secondary-container: '#785c29'
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
  secondary-fixed: '#ffdea8'
  secondary-fixed-dim: '#e6c183'
  on-secondary-fixed: '#271900'
  on-secondary-fixed-variant: '#5b4311'
  tertiary-fixed: '#ffdcc2'
  tertiary-fixed-dim: '#ecbd98'
  on-tertiary-fixed: '#2e1501'
  on-tertiary-fixed-variant: '#604023'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  headline-xl:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-padding: 32px
  gutter: 24px
  card-inner-padding: 32px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style

The design system is anchored in "Quiet Luxury"—a philosophy that prioritizes substance, precision, and understated elegance over loud marketing. Designed for the discerning user in Turkey who values time and quality, the UI evokes the atmosphere of a premium Swiss fintech dashboard.

The aesthetic combines **Minimalism** with **Glassmorphism**. It utilizes expansive white space, razor-sharp typography, and sophisticated translucent layers to create a sense of depth and exclusivity. The interface should feel like a high-end concierge service: reliable, organized, and effortlessly calm.

## Colors

The palette is restrained and intentional. 
- **Primary:** Deep Teal (#002e35) is the core of the brand, used for critical actions and brand markers to convey stability and premium status.
- **Background:** Pearl (#f8f9fa) serves as the canvas, providing a warmer, more sophisticated alternative to pure white.
- **Secondary/Accent:** A muted metallic gold or champagne is used sparingly for high-value rewards or "Best Price" highlights.
- **On-Surface:** A near-black charcoal (#191c1d) ensures maximum legibility while maintaining a softer contrast than absolute black.

## Typography

This design system employs a dual-typeface strategy to balance character with utility. 

**Manrope** is used for headlines to provide a modern, geometric, and high-end feel. Its varying weights (600-800) are used to create clear information hierarchy. 

**Inter** is used for all body text, data points, and UI labels. It provides the "Swiss precision" required for a comparison app, ensuring high legibility at small sizes and across dense price grids. For Turkish language support, ensure specific glyphs (ğ, ü, ş, ı, ö, ç) are treated with the same weight and spacing consistency as standard Latin characters.

## Layout & Spacing

The layout philosophy emphasizes the "luxury of space." We use a **Fixed Grid** for desktop (12 columns) and a **Fluid Grid** for mobile (4 columns). 

Key spacing principles:
- **Generous Padding:** Card elements must use a 32px (2rem) inner padding to avoid visual clutter and signal a premium experience.
- **Rhythm:** All spacing is based on an 8px base unit.
- **Margins:** A consistent 32px side margin on mobile ensures the content feels floating and intentional rather than cramped against the bezel.

## Elevation & Depth

Depth is communicated through **Glassmorphism** rather than traditional heavy shadows.

- **Surface Layers:** The primary container style uses a semi-transparent pearl background (`rgba(252, 252, 253, 0.8)`) with a `16px` backdrop-filter blur.
- **Strokes:** To define boundaries, every glass element features a subtle `1px` solid white border at 50% opacity, simulating a light-catching edge.
- **Shadows:** Use only "Ambient Shadows"—extremely soft, large-radius blurs with very low opacity (approx 4-6%) to lift cards slightly off the pearl background without creating "dirt."

## Shapes

The shape language is sophisticated and varied to distinguish between interactive and structural elements:
- **Interactive Elements:** Buttons and Input fields use a **Soft** radius (8px) for a precise, professional look.
- **Containers:** Content cards and modals use a more generous **Rounded** radius (12px to 16px) to appear approachable.
- **Status/Tags:** Chips and badges are always **Pill-shaped** to contrast against the structured grid of the app.

## Components

### Buttons
Primary buttons are solid Deep Teal (#002e35) with white Manrope text. Secondary buttons are ghost-style with a 1px teal border. Border radius is strictly 8px.

### Cards
Cards are the primary vehicle for price comparisons. They must utilize the Glass Effect (16px blur) and 32px internal padding. Price points should be rendered in Manrope 700 to stand out.

### Inputs
Search bars and filter inputs use a light pearl fill with a 1px border that shifts to Deep Teal on focus. 8px corner radius is standard.

### Chips (Pill)
Used for food categories (e.g., "Kebab," "Sushi") or delivery speed. These are fully rounded (pill) with a light teal tint or subtle glass background.

### Price Comparison List
List items should have a subtle divider (1px, 10% opacity on-surface) and ample vertical breathing room (minimum 24px height per row). Use Inter for the restaurant name and Manrope for the currency/price.