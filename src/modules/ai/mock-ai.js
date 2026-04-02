const { validateWorldState } = require("../../lib/contracts");

function calculateDemandForecast(demand, events, connectivityStatus) {
  let multiplier = 1;
  let reason = "Base demand";

  for (const event of events) {
    if (event.type === "demand_spike") {
      multiplier = Math.max(multiplier, 1.5);
      reason = event.description;
    } else if (event.type === "weather_alert") {
      multiplier = Math.max(multiplier, 1.2);
      reason = event.description;
    } else if (event.type === "road_block") {
      multiplier = Math.max(multiplier, 1.1);
      reason = event.description;
    }
  }

  if (connectivityStatus === "unstable") {
    multiplier += 0.05;
    reason = `${reason}; conservative uplift due to unstable connectivity`;
  }

  return {
    predicted_quantity: Math.ceil(demand.quantity * multiplier),
    confidence: Number(Math.max(0.55, 0.9 - (multiplier - 1) * 0.2).toFixed(2)),
    reason
  };
}

function calculateRouteAdjustment(edge, events) {
  let riskScore = edge.risk_score;
  let delayMultiplier = 1 + edge.risk_score;
  let reason = "Baseline route assessment";

  for (const event of events) {
    if (event.type === "road_block" && edge.status === "blocked") {
      riskScore = Math.max(riskScore, 0.98);
      delayMultiplier = Math.max(delayMultiplier, 2.2);
      reason = event.description;
    } else if (event.type === "connectivity_loss") {
      riskScore = Math.max(riskScore, 0.65);
      delayMultiplier = Math.max(delayMultiplier, 1.35);
      reason = event.description;
    } else if (event.type === "demand_spike") {
      riskScore = Math.max(riskScore, edge.risk_score + 0.1);
      delayMultiplier = Math.max(delayMultiplier, 1.15);
      reason = "Higher dispatch pressure on the route";
    }
  }

  return {
    edge_id: edge.edge_id,
    predicted_delay_multiplier: Number(delayMultiplier.toFixed(2)),
    risk_score: Number(Math.min(0.99, riskScore).toFixed(2)),
    reason
  };
}

function buildRecommendations(worldState, forecasts, routeAdjustments) {
  const recommendations = [];

  for (const forecast of forecasts) {
    recommendations.push({
      type: "priority_increase",
      target_id: forecast.node_id,
      new_priority: "critical"
    });
  }

  for (const route of routeAdjustments) {
    recommendations.push({
      type: "reroute",
      target_id: route.edge_id,
      action: route.risk_score >= 0.8 ? "avoid_if_possible" : "monitor"
    });
  }

  if (worldState.execution_context.connectivity_status === "unstable") {
    recommendations.push({
      type: "degraded_mode",
      target_id: worldState.scenario_id,
      action: "use_last_valid_snapshot"
    });
  }

  return recommendations;
}

function runMockAi(worldState) {
  validateWorldState(worldState);

  const deliveryNodes = worldState.nodes.filter((node) => node.node_type === "delivery_point");
  const routeAdjustments = worldState.edges.map((edge) =>
    calculateRouteAdjustment(edge, worldState.events)
  );
  const demandForecasts = [];

  for (const node of deliveryNodes) {
    const relevantEvents = worldState.events.filter(
      (event) =>
        (event.affected_node_ids || []).includes(node.node_id) ||
        event.type === "demand_spike" ||
        event.type === "connectivity_loss"
    );

    for (const demand of node.demands || []) {
      const forecast = calculateDemandForecast(
        demand,
        relevantEvents,
        worldState.execution_context.connectivity_status
      );

      demandForecasts.push({
        node_id: node.node_id,
        resource_id: demand.resource_id,
        predicted_quantity: forecast.predicted_quantity,
        confidence: forecast.confidence,
        reason: forecast.reason
      });
    }
  }

  const recommendations = buildRecommendations(worldState, demandForecasts, routeAdjustments);
  const summaryParts = [];

  if (worldState.events.some((event) => event.type === "demand_spike")) {
    summaryParts.push("Demand spike detected and critical deliveries reprioritized.");
  }
  if (worldState.edges.some((edge) => edge.status === "blocked")) {
    summaryParts.push("Blocked route detected; avoid affected edges if possible.");
  }
  if (worldState.execution_context.connectivity_status === "unstable") {
    summaryParts.push("Connectivity is unstable; degraded mode fallback should be available.");
  }
  if (summaryParts.length === 0) {
    summaryParts.push("Network looks stable; proceed with baseline allocation.");
  }

  return {
    schema_version: worldState.schema_version,
    scenario_id: worldState.scenario_id,
    timestamp: new Date().toISOString(),
    model_info: {
      provider: "mock-rule-engine",
      model: "heuristic-v1"
    },
    summary: summaryParts.join(" "),
    demand_forecasts: demandForecasts,
    route_risk_adjustments: routeAdjustments,
    recommendations:
      recommendations.length > 0
        ? recommendations
        : [
            {
              type: "monitor",
              target_id: worldState.scenario_id,
              action: "keep_baseline_plan"
            }
          ]
  };
}

module.exports = {
  runMockAi
};
