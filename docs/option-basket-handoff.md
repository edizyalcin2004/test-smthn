# Option basket and ordering handoff

Requires the candidate backend `codex/options-links-matching` in pryce-backend.
Release the matching API contract before this app build. Production currently
lacks the new contract, so a production-only UI smoke test cannot verify it yet.

Basket lines store one source platform and its native option IDs. The editor
honors nested groups, selection bounds, disabled prices, hidden groups and
measured optionality. Changing quantity retains the selection; changing a
basket invalidates results. Responses for an older basket are discarded.

Only complete `available: true` rows with non-null item prices and totals rank.
Missing data is not a zero price. Item totals exclude delivery fees. Ordering
buttons use allowlisted HTTPS restaurant/platform destinations and let the OS
select an installed verified app or browser. They do not transfer a basket.

Validation: five Node selection/URL tests; Expo iOS and Android exports succeed.
Actual installed third-party app handoff and on-device layout remain release QA.
Some source platforms cannot provide priceable choices, and no configurable
cross-platform tree qualified in the September 6 McDonald's backend audit.
The UI must keep those comparisons unavailable; do not add guessed defaults.
