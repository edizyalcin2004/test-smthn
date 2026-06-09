---
name: project-deals-screen
description: DealsScreen.js clipboard pattern and Bang for Buck reference — copyCode uses setTimeout 1500ms with no clearTimeout/toastRef; BfB algorithm is identical to HubScreen
metadata:
  type: project
---

DealsScreen (`src/screens/DealsScreen.js`) is the canonical reference for:

**Clipboard copy pattern:**
```js
function copyCode(code) {
  Clipboard.setString(code);
  setCopied(code);
  setTimeout(() => setCopied(null), 1500);
}
```
No `clearTimeout`, no `toastRef`, timeout is **1500 ms** (not 2000 ms). Any screen that claims to match DealsScreen must use exactly this form.

**Bang for Buck algorithm:** Identical implementation in both DealsScreen and HubScreen — iterates `Özel Menüler` category items, splits `description` by ` + `, looks up component prices on the same platform, sums them into `individualSum`, computes `savings = individualSum - bundlePrice` and `savingsPct = Math.round((savings / individualSum) * 100)`.

**Why:** DealsScreen was the first approved implementation and is the explicit review checklist reference. All other screens must match its patterns exactly.

**How to apply:** When reviewing clipboard or BfB logic on any screen, compare directly against DealsScreen's implementation above. Flag any deviation in timeout value, variable names, or algorithm steps.
