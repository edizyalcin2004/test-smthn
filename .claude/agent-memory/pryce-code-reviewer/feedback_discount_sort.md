---
name: feedback-discount-sort
description: Discount codes must carry a discount_value field and be sorted by it; parsing the label string is incorrect and produces wrong order when mixing % and ₺ types
metadata:
  type: feedback
---

The `DISCOUNT_CODES` array must include a numeric `discount_value` field on each entry. Sorting must use `.sort((a, b) => b.discount_value - a.discount_value)`.

**Why:** A `parseCodeValue` label-parsing approach compares `%15` → 15 against `₺20` → 20 on the same numeric axis. This is semantically wrong: a `₺20` fixed discount on a `₺200` minimum order is ~10% effective, less than `%15`. HubScreen v1 made this mistake.

**How to apply:** In any file that sorts discount codes, check for a `discount_value` field on each entry. If it's absent, flag ❌ and require the field be added explicitly. Never approve label-string parsing as a sort key.
