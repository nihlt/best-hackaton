const { validateWorldState } = require("../../lib/contracts");


function calculateDemandForecast(demand, node, events, connectivityStatus) {
  let multiplier = 1;
  let reason = "Base demand, no significant events detected.";

  for (const event of events) {
    if (event.type === "demand_spike") {
      multiplier = Math.max(multiplier, 1.5);
      reason = event.description || "Demand spike detected at this node.";
    } else if (event.type === "weather_alert") {
      multiplier = Math.max(multiplier, 1.2);
      reason = event.description || "Weather alert may increase local demand.";
    } else if (event.type === "road_block") {
      multiplier = Math.max(multiplier, 1.1);
      reason = event.description || "Road block nearby may delay resupply.";
    }
  }

  if (connectivityStatus === "unstable") {
    multiplier += 0.05;
    reason = `${reason} Conservative uplift applied due to unstable connectivity.`;
  }

  if (demand.priority === "critical" && multiplier === 1) {
    multiplier = 1.15;
    reason = "Critical priority demand — conservative uplift applied even without events.";
  }

  const predicted_quantity = Math.ceil(demand.quantity * multiplier);
  const confidence = Number(Math.max(0.55, 0.9 - (multiplier - 1) * 0.2).toFixed(2));

  return { predicted_quantity, confidence, reason };
}


function calculateRouteAdjustment(edge, events) {

  let riskScore = edge.risk_score;
  let delayMultiplier = 1.0;
  let reason = "Baseline route assessment — no significant events on this edge.";


  if (edge.risk_score >= 0.5) {
    delayMultiplier = 1.0 + edge.risk_score * 0.5;
    reason = `Edge has elevated baseline risk score of ${edge.risk_score.toFixed(2)}.`;
  }


  if (edge.status === "blocked") {
    riskScore = Math.max(riskScore, 0.98);
    delayMultiplier = Math.max(delayMultiplier, 2.5);
    reason = `Route ${edge.edge_id} is blocked. Deliveries on this path are not possible.`;
  }

  for (const event of events) {
    if (event.type === "road_block") {
      riskScore = Math.max(riskScore, 0.95);
      delayMultiplier = Math.max(delayMultiplier, 2.2);
      reason = event.description || "Road block event affecting this route.";
    } else if (event.type === "connectivity_loss") {
      riskScore = Math.max(riskScore, 0.65);
      delayMultiplier = Math.max(delayMultiplier, 1.35);
      reason = event.description || "Connectivity loss may delay dispatch on this route.";
    } else if (event.type === "weather_alert") {
      riskScore = Math.max(riskScore, edge.risk_score + 0.15);
      delayMultiplier = Math.max(delayMultiplier, 1.2);
      reason = event.description || "Weather alert may slow travel on this route.";
    } else if (event.type === "demand_spike") {
      riskScore = Math.max(riskScore, edge.risk_score + 0.1);
      delayMultiplier = Math.max(delayMultiplier, 1.15);
      reason = "Higher dispatch pressure on this route due to demand spike.";
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
    const node = worldState.nodes.find((n) => n.node_id === forecast.node_id);
    const hasCriticalDemand = (node?.demands ?? []).some((d) => d.priority === "critical");
    const demandOriginal = (node?.demands ?? []).find((d) => d.resource_id === forecast.resource_id);
    const spiked = demandOriginal && forecast.predicted_quantity > demandOriginal.quantity * 1.2;

    if (hasCriticalDemand || spiked) {
      recommendations.push({
        type: "priority_increase",
        target_id: forecast.node_id,
        new_priority: "critical"
      });
    }
  }

  for (const route of routeAdjustments) {
    const edge = worldState.edges.find((e) => e.edge_id === route.edge_id);
    if (edge?.status === "blocked" || route.risk_score >= 0.8) {
      recommendations.push({
        type: "reroute",
        target_id: route.edge_id,
        action: "avoid_if_possible"
      });
    } else if (route.risk_score >= 0.6) {
      recommendations.push({
        type: "reroute",
        target_id: route.edge_id,
        action: "monitor"
      });
    }
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


function buildSummary(worldState, demandForecasts, routeAdjustments) {
  const parts = [];

  const connectivity = worldState.execution_context.connectivity_status;
  if (connectivity === "unstable") {
    parts.push("Connectivity is unstable — operating in degraded mode with conservative demand estimates.");
  } else if (connectivity === "offline") {
    parts.push("Network is offline — displaying last known plan.");
  }

  const blockedEdges = worldState.edges.filter((e) => e.status === "blocked");
  if (blockedEdges.length > 0) {
    const ids = blockedEdges.map((e) => e.edge_id).join(", ");
    parts.push(`Blocked route(s) detected: ${ids}. Alternative paths should be considered.`);
  }

  const highRiskRoutes = routeAdjustments.filter((r) => r.risk_score >= 0.8 && !blockedEdges.some((e) => e.edge_id === r.edge_id));
  if (highRiskRoutes.length > 0) {
    parts.push(`High-risk route(s): ${highRiskRoutes.map((r) => r.edge_id).join(", ")} — delays expected.`);
  }

  const criticalNodes = worldState.nodes.filter(
    (n) => n.node_type === "delivery_point" && (n.demands ?? []).some((d) => d.priority === "critical")
  );
  if (criticalNodes.length > 0) {
    parts.push(`Critical demand at: ${criticalNodes.map((n) => n.node_id).join(", ")}.`);
  }

  const spikedForecasts = demandForecasts.filter((f) => {
    const node = worldState.nodes.find((n) => n.node_id === f.node_id);
    const original = (node?.demands ?? []).find((d) => d.resource_id === f.resource_id);
    return original && f.predicted_quantity > original.quantity * 1.2;
  });
  if (spikedForecasts.length > 0) {
    parts.push(`Demand forecast increased significantly at: ${[...new Set(spikedForecasts.map((f) => f.node_id))].join(", ")}.`);
  }

  if (parts.length === 0) {
    parts.push("Network looks stable. Proceeding with baseline allocation — no critical issues detected.");
  }

  return parts.join(" ");
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
        node,
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
  const summary = buildSummary(worldState, demandForecasts, routeAdjustments);

  return {
    schema_version: worldState.schema_version,
    scenario_id: worldState.scenario_id,
    timestamp: new Date().toISOString(),
    model_info: {
      provider: "mock-rule-engine",
      model: "heuristic-v1"
    },
    summary,
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
