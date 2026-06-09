---
name: feedback-token-system
description: Recurring violation — developers hardcode #00464f instead of using colors.primary from tokens.js; tokens.js primary is #006566, not #00464f
metadata:
  type: feedback
---

Developers habitually write `#00464f` in StyleSheet definitions instead of `colors.primary`. The token file (`src/theme/tokens.js`) defines `colors.primary` as `#006566` — a different value. Every review must grep for `#00464f` and flag each occurrence as a token bypass.

**Why:** The design system spec in the system prompt says the primary color is `#00464f`, but the token file uses `#006566`. This mismatch means hardcoded values silently diverge from the live token and will not update if the token changes.

**How to apply:** In every review, after reading the file, run a mental (or literal) grep for `#00464f`. Any match outside of `DISCOUNT_CODES` or platform color constants is a violation — replace with `colors.primary`. Also check `#666666` and other near-neutral grays that should use `colors.textSecondary` (`#6f797b`).
