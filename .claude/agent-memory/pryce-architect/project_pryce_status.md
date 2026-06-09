---
name: project-pryce-status
description: Build state of the Pryce app: which screens are implemented, backend URL, and test method
metadata:
  type: project
---

Pryce is a React Native / Expo food delivery price comparison app for Turkey.

Backend: https://pryce-backend-production.up.railway.app (live on Railway)

Confirmed implemented screens:
- HubScreen (Hub tab) — live, fetches /menu-items, Bang for Buck carousel + hardcoded discount codes
- DealsScreen (Deals tab) — live, fetches /menu-items, restaurant search, platform sections, Bang for Buck list
- CompareScreen (Compare tab) — referenced via navigation.navigate('Compare') from HubScreen
- AccountScreen, BudgetScreen — stubbed
- compare/SearchScreen — present in filesystem

Test method: Expo Go on iPhone.

**Why:** These are the screens confirmed by reading the actual source files, not from git history.
**How to apply:** When planning new features, treat Hub and Deals as the reference implementations. Do not assume AccountScreen or BudgetScreen have live data.
