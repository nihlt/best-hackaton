# Mock AI

This module is rule-based on purpose.

It reads `world_state.json` and generates:

- `summary`
- `demand_forecasts`
- `route_risk_adjustments`
- `recommendations`

The output shape must stay stable even when the internal logic changes later.
