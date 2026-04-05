const { validateOptimizerInput } = require("../../lib/contracts");

const PRIORITY_SCORE = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
};

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function runMockOptimizer(optimizerInput) {
  validateOptimizerInput(optimizerInput);

  const routeByNode = new Map(optimizerInput.routes.map((route) => [route.to_node_id, route]));
  const supplyByResource = new Map();

  for (const item of optimizerInput.supply) {
    const current = supplyByResource.get(item.resource_id) || 0;
    supplyByResource.set(item.resource_id, current + item.quantity);
  }

  const vehicles = [...optimizerInput.vehicles].sort((left, right) => right.capacity - left.capacity);
  const demands = [...optimizerInput.demand].sort((left, right) => {
    const priorityGap = (PRIORITY_SCORE[right.priority] || 0) - (PRIORITY_SCORE[left.priority] || 0);
    if (priorityGap !== 0) {
      return priorityGap;
    }
    return right.quantity - left.quantity;
  });

  const allocationPlan = [];
  const unservedDemands = [];
  const alerts = [];
  const explanation = [];
  const deliveredByVehicle = new Map();
  let deliveredTotal = 0;
  let totalRouteTime = 0;

  for (const demand of demands) {
    const route = routeByNode.get(demand.node_id);
    const availableSupply = supplyByResource.get(demand.resource_id) || 0;
    const vehicle = vehicles.find((item) => (item.supported_resources || []).includes(demand.resource_id));

    if (!route || !route.available) {
      unservedDemands.push({
        node_id: demand.node_id,
        resource_id: demand.resource_id,
        quantity: demand.quantity,
        reason: "route_unavailable"
      });
      alerts.push({
        severity: "critical",
        type: "route_blocked",
        target_id: demand.node_id,
        message: `No available route for ${demand.node_id}.`
      });
      explanation.push(`Demand at ${demand.node_id} was left unserved because the route is unavailable.`);
      continue;
    }

    if (!vehicle) {
      unservedDemands.push({
        node_id: demand.node_id,
        resource_id: demand.resource_id,
        quantity: demand.quantity,
        reason: "no_compatible_vehicle"
      });
      alerts.push({
        severity: "warning",
        type: "vehicle_missing",
        target_id: demand.node_id,
        message: `No compatible vehicle for ${demand.resource_id}.`
      });
      explanation.push(`Demand at ${demand.node_id} could not be served because no compatible vehicle exists.`);
      continue;
    }

    const plannedQuantity = Math.min(demand.quantity, availableSupply, vehicle.capacity);

    if (plannedQuantity <= 0) {
      unservedDemands.push({
        node_id: demand.node_id,
        resource_id: demand.resource_id,
        quantity: demand.quantity,
        reason: "insufficient_supply"
      });
      alerts.push({
        severity: "warning",
        type: "stock_low",
        target_id: demand.resource_id,
        message: `Insufficient supply for ${demand.resource_id}.`
      });
      explanation.push(`Demand at ${demand.node_id} could not be served because warehouse stock is insufficient.`);
      continue;
    }

    supplyByResource.set(demand.resource_id, availableSupply - plannedQuantity);
    deliveredTotal += plannedQuantity;
    totalRouteTime += route.travel_time_min;
    deliveredByVehicle.set(
      vehicle.vehicle_id,
      (deliveredByVehicle.get(vehicle.vehicle_id) || 0) + plannedQuantity
    );

    allocationPlan.push({
      vehicle_id: vehicle.vehicle_id,
      resource_id: demand.resource_id,
      quantity: plannedQuantity,
      from_node_id: vehicle.start_node_id,
      to_node_id: demand.node_id,
      planned_path: [vehicle.start_node_id, demand.node_id],
      eta_min: route.travel_time_min,
      status: plannedQuantity === demand.quantity ? "planned" : "partial"
    });

    if (plannedQuantity < demand.quantity) {
      unservedDemands.push({
        node_id: demand.node_id,
        resource_id: demand.resource_id,
        quantity: demand.quantity - plannedQuantity,
        reason: "capacity_or_supply_limit"
      });
      alerts.push({
        severity: "warning",
        type: "partial_delivery",
        target_id: demand.node_id,
        message: `Demand at ${demand.node_id} was only partially served.`
      });
      explanation.push(`Demand at ${demand.node_id} was partially served because supply or vehicle capacity was limited.`);
    } else {
      explanation.push(`Demand at ${demand.node_id} was served because it had ${demand.priority} priority and an available route.`);
    }
  }

  if (optimizerInput.constraints.forbidden_edge_ids.length > 0) {
    alerts.push({
      severity: "warning",
      type: "degraded_mode",
      target_id: optimizerInput.scenario_id,
      message: "One or more routes are forbidden. Plan generated in degraded mode."
    });
  }

  const unmetDemand = sum(unservedDemands.map((item) => item.quantity));
  const vehicleUtilization =
    vehicles.length === 0
      ? 0
      : Number(
          (
            sum(
              vehicles.map((vehicle) => {
                const delivered = deliveredByVehicle.get(vehicle.vehicle_id) || 0;
                return Math.min(delivered, vehicle.capacity) / Math.max(1, vehicle.capacity);
              })
            ) / vehicles.length
          ).toFixed(2)
        );
  const avgDeliveryTime = allocationPlan.length === 0 ? 0 : Math.round(totalRouteTime / allocationPlan.length);
  const score = Math.max(0, Number((100 - unmetDemand * 0.1 - alerts.length * 2).toFixed(1)));

  return {
    schema_version: optimizerInput.schema_version,
    scenario_id: optimizerInput.scenario_id,
    timestamp: new Date().toISOString(),
    objective: {
      type: optimizerInput.objective,
      score
    },
    kpis: {
      total_delivered: deliveredTotal,
      unmet_demand: unmetDemand,
      vehicle_utilization: vehicleUtilization,
      avg_delivery_time_min: avgDeliveryTime
    },
    allocation_plan: allocationPlan,
    unserved_demands: unservedDemands,
    alerts,
    explanation
  };
}

module.exports = {
  runMockOptimizer
};
