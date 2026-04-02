const { validateAiAnalysis, validateWorldState } = require("../lib/contracts");

const PRIORITY_WEIGHT = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
};

function buildOptimizerInput(worldState, aiAnalysis) {
  validateWorldState(worldState);
  validateAiAnalysis(aiAnalysis);

  const demandForecastMap = new Map();
  for (const forecast of aiAnalysis.demand_forecasts) {
    demandForecastMap.set(`${forecast.node_id}:${forecast.resource_id}`, forecast);
  }

  const routeAdjustmentMap = new Map();
  for (const adjustment of aiAnalysis.route_risk_adjustments) {
    routeAdjustmentMap.set(adjustment.edge_id, adjustment);
  }

  const supply = [];
  const demand = [];

  for (const node of worldState.nodes) {
    if (node.node_type === "warehouse") {
      for (const item of node.inventory || []) {
        supply.push({
          node_id: node.node_id,
          resource_id: item.resource_id,
          quantity: item.quantity
        });
      }
    }

    if (node.node_type === "delivery_point") {
      for (const item of node.demands || []) {
        const forecast = demandForecastMap.get(`${node.node_id}:${item.resource_id}`);
        demand.push({
          node_id: node.node_id,
          resource_id: item.resource_id,
          quantity: forecast ? forecast.predicted_quantity : item.quantity,
          priority: item.priority,
          priority_weight: PRIORITY_WEIGHT[item.priority] || PRIORITY_WEIGHT.medium
        });
      }
    }
  }

  const routes = worldState.edges.map((edge) => {
    const adjustment = routeAdjustmentMap.get(edge.edge_id);
    const riskScore = adjustment ? adjustment.risk_score : edge.risk_score;
    const delayMultiplier = adjustment ? adjustment.predicted_delay_multiplier : 1;

    return {
      edge_id: edge.edge_id,
      from_node_id: edge.from_node_id,
      to_node_id: edge.to_node_id,
      distance_km: edge.distance_km,
      travel_time_min: Math.round(edge.estimated_travel_time_min * delayMultiplier),
      risk_score: riskScore,
      available: edge.status !== "blocked"
    };
  });

  const forbiddenEdgeIds = routes.filter((route) => !route.available).map((route) => route.edge_id);

  return {
    schema_version: worldState.schema_version,
    scenario_id: worldState.scenario_id,
    timestamp: new Date().toISOString(),
    objective: "min_unmet_demand_with_risk_penalty",
    constraints: {
      max_route_time_min: 120,
      allow_partial_delivery: true,
      respect_vehicle_capacity: true,
      forbidden_edge_ids: forbiddenEdgeIds
    },
    resources: worldState.resources.map((resource) => ({
      resource_id: resource.resource_id,
      unit: resource.unit
    })),
    supply,
    demand,
    routes,
    vehicles: worldState.vehicles.map((vehicle) => ({
      vehicle_id: vehicle.vehicle_id,
      vehicle_type: vehicle.vehicle_type,
      capacity: vehicle.capacity,
      supported_resources: vehicle.supported_resources,
      start_node_id: vehicle.current_node_id
    }))
  };
}

module.exports = {
  buildOptimizerInput
};
