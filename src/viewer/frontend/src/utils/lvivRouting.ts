import { roadGraphEdges, roadGraphNodes } from '../data/lvivRoadGraph';
import type { AiAnalysis, Edge, Location, Node, Priority, Solution, Vehicle, WorldState } from '../types/types';

const AVERAGE_CITY_SPEED_KMH = 26;

interface GraphEdge {
  to: string;
  distanceKm: number;
}

interface RoutePath {
  graphNodeIds: string[];
  polyline: Location[];
  distanceKm: number;
  travelTimeMin: number;
}

export interface DerivedRoutingState {
  edges: Edge[];
  edgePolylines: Record<string, Location[]>;
  allocationPolylines: Record<string, Location[]>;
  solution: Solution;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function haversineDistanceKm(from: Location, to: Location) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
}

function buildAdjacencyList() {
  const adjacency = new Map<string, GraphEdge[]>();

  for (const node of roadGraphNodes) {
    adjacency.set(node.id, []);
  }

  for (const edge of roadGraphEdges) {
    const fromNode = roadGraphNodes.find((node) => node.id === edge.from);
    const toNode = roadGraphNodes.find((node) => node.id === edge.to);

    if (!fromNode || !toNode) {
      continue;
    }

    const distanceKm = haversineDistanceKm(fromNode.location, toNode.location);
    adjacency.get(edge.from)?.push({ to: edge.to, distanceKm });
    adjacency.get(edge.to)?.push({ to: edge.from, distanceKm });
  }

  return adjacency;
}

const adjacencyList = buildAdjacencyList();
const graphNodeById = new Map(roadGraphNodes.map((node) => [node.id, node]));

function estimateTravelTimeMinutes(distanceKm: number) {
  return Math.max(3, Math.round((distanceKm / AVERAGE_CITY_SPEED_KMH) * 60));
}

function calculateRiskScore(distanceKm: number) {
  return Math.min(0.85, Number((0.12 + distanceKm * 0.03).toFixed(2)));
}

function findNearestRoadNode(location: Location) {
  let bestNodeId = roadGraphNodes[0]?.id;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const node of roadGraphNodes) {
    const distance = haversineDistanceKm(location, node.location);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestNodeId = node.id;
    }
  }

  return bestNodeId;
}

function runDijkstra(startNodeId: string, endNodeId: string): string[] {
  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const queue = new Set<string>(roadGraphNodes.map((node) => node.id));

  for (const node of roadGraphNodes) {
    distances.set(node.id, Number.POSITIVE_INFINITY);
    previous.set(node.id, null);
  }

  distances.set(startNodeId, 0);

  while (queue.size > 0) {
    let currentNodeId: string | null = null;
    let currentDistance = Number.POSITIVE_INFINITY;

    for (const nodeId of queue) {
      const distance = distances.get(nodeId) ?? Number.POSITIVE_INFINITY;
      if (distance < currentDistance) {
        currentDistance = distance;
        currentNodeId = nodeId;
      }
    }

    if (!currentNodeId) {
      break;
    }

    queue.delete(currentNodeId);

    if (currentNodeId === endNodeId) {
      break;
    }

    const neighbors = adjacencyList.get(currentNodeId) ?? [];
    for (const neighbor of neighbors) {
      if (!queue.has(neighbor.to)) {
        continue;
      }

      const candidateDistance = currentDistance + neighbor.distanceKm;
      if (candidateDistance < (distances.get(neighbor.to) ?? Number.POSITIVE_INFINITY)) {
        distances.set(neighbor.to, candidateDistance);
        previous.set(neighbor.to, currentNodeId);
      }
    }
  }

  const path: string[] = [];
  let cursor: string | null = endNodeId;

  while (cursor) {
    path.unshift(cursor);
    cursor = previous.get(cursor) ?? null;
  }

  return path[0] === startNodeId ? path : [startNodeId, endNodeId];
}

function buildRoutePath(from: Location, to: Location): RoutePath {
  const fromRoadNode = findNearestRoadNode(from);
  const toRoadNode = findNearestRoadNode(to);
  const graphNodeIds = runDijkstra(fromRoadNode, toRoadNode);

  const graphLocations = graphNodeIds
    .map((graphNodeId) => graphNodeById.get(graphNodeId)?.location)
    .filter((location): location is Location => Boolean(location));

  const polyline = [from, ...graphLocations, to];
  let distanceKm = 0;

  for (let index = 1; index < polyline.length; index += 1) {
    distanceKm += haversineDistanceKm(polyline[index - 1], polyline[index]);
  }

  return {
    graphNodeIds,
    polyline,
    distanceKm: Number(distanceKm.toFixed(2)),
    travelTimeMin: estimateTravelTimeMinutes(distanceKm),
  };
}

function priorityScore(priority: Priority) {
  switch (priority) {
    case 'critical':
      return 4;
    case 'high':
    case 'elevated':
      return 3;
    case 'medium':
    case 'normal':
      return 2;
    case 'low':
    default:
      return 1;
  }
}

function rankDemands(nodes: Node[]) {
  return nodes
    .filter((node) => node.node_type === 'delivery_point')
    .flatMap((node) =>
      (node.demands ?? []).map((demand) => ({
        node,
        demand,
      })),
    )
    .sort((left, right) => {
      const priorityGap = priorityScore(right.demand.priority) - priorityScore(left.demand.priority);
      if (priorityGap !== 0) {
        return priorityGap;
      }

      return right.demand.quantity - left.demand.quantity;
    });
}

function cloneVehicles(vehicles: Vehicle[]) {
  return vehicles.map((vehicle) => ({
    ...vehicle,
    supported_resources: [...vehicle.supported_resources],
  }));
}

function deriveVehicleUtilization(vehicles: Vehicle[], deliveredByVehicle: Map<string, number>) {
  if (vehicles.length === 0) {
    return 0;
  }

  const utilization = vehicles.reduce((total, vehicle) => {
    const delivered = deliveredByVehicle.get(vehicle.vehicle_id) ?? 0;
    return total + Math.min(delivered, vehicle.capacity) / Math.max(1, vehicle.capacity);
  }, 0);

  return Number((utilization / vehicles.length).toFixed(2));
}

function buildStaticEdges(worldState: WorldState) {
  const warehouses = worldState.nodes.filter((node) => node.node_type === 'warehouse');
  const deliveryPoints = worldState.nodes.filter((node) => node.node_type === 'delivery_point');
  const edges: Edge[] = [];
  const polylines: Record<string, Location[]> = {};
  const routeCache = new Map<string, RoutePath>();

  for (const warehouse of warehouses) {
    for (const deliveryPoint of deliveryPoints) {
      const edgeId = `route_${warehouse.node_id}_${deliveryPoint.node_id}`;
      const route = buildRoutePath(warehouse.location, deliveryPoint.location);
      routeCache.set(`${warehouse.node_id}:${deliveryPoint.node_id}`, route);
      polylines[edgeId] = route.polyline;

      edges.push({
        edge_id: edgeId,
        from_node_id: warehouse.node_id,
        to_node_id: deliveryPoint.node_id,
        distance_km: route.distanceKm,
        estimated_travel_time_min: route.travelTimeMin,
        travel_time_min: route.travelTimeMin,
        status: 'open',
        risk_score: calculateRiskScore(route.distanceKm),
      });
    }
  }

  return { edges, polylines, routeCache };
}

export function deriveRoutingState(worldState: WorldState, aiAnalysis: AiAnalysis): DerivedRoutingState {
  const { edges, polylines, routeCache } = buildStaticEdges(worldState);
  const vehicles = cloneVehicles(worldState.vehicles);
  const allocationPolylines: Record<string, Location[]> = {};
  const deliveredByVehicle = new Map<string, number>();
  const supplyByWarehouse = new Map<string, Map<string, number>>();
  const allocationPlan: Solution['allocation_plan'] = [];
  const unservedDemands: NonNullable<Solution['unserved_demands']> = [];
  const alerts: Solution['alerts'] = [];
  const explanation: string[] = [];
  let deliveredTotal = 0;
  let totalTravelTime = 0;

  for (const warehouse of worldState.nodes.filter((node) => node.node_type === 'warehouse')) {
    const supply = new Map<string, number>();
    for (const item of warehouse.inventory ?? []) {
      supply.set(item.resource_id, item.quantity);
    }
    supplyByWarehouse.set(warehouse.node_id, supply);
  }

  const aiDemandForecasts = new Map(
    aiAnalysis.demand_forecasts.map((forecast) => [`${forecast.node_id}:${forecast.resource_id}`, forecast]),
  );

  for (const { node, demand } of rankDemands(worldState.nodes)) {
    const forecast = aiDemandForecasts.get(`${node.node_id}:${demand.resource_id}`);
    const effectiveDemand = forecast ? forecast.predicted_quantity : demand.quantity;
    const compatibleVehicle = vehicles.find((vehicle) => vehicle.supported_resources.includes(demand.resource_id));

    if (!compatibleVehicle) {
      unservedDemands.push({
        node_id: node.node_id,
        resource_id: demand.resource_id,
        quantity: effectiveDemand,
        reason: 'no_compatible_vehicle',
      });
      alerts.push({
        severity: 'warning',
        type: 'vehicle_missing',
        target_id: node.node_id,
        message: `No compatible vehicle for ${demand.resource_id}.`,
      });
      explanation.push(`Demand at ${node.node_id} stays unserved because no compatible vehicle is available.`);
      continue;
    }

    const bestWarehouse = worldState.nodes
      .filter((item) => item.node_type === 'warehouse')
      .map((warehouse) => {
        const route = routeCache.get(`${warehouse.node_id}:${node.node_id}`);
        const supply = supplyByWarehouse.get(warehouse.node_id)?.get(demand.resource_id) ?? 0;
        return { warehouse, route, supply };
      })
      .filter((item) => item.route && item.supply > 0)
      .sort((left, right) => (left.route?.travelTimeMin ?? Number.POSITIVE_INFINITY) - (right.route?.travelTimeMin ?? Number.POSITIVE_INFINITY))[0];

    if (!bestWarehouse?.route) {
      unservedDemands.push({
        node_id: node.node_id,
        resource_id: demand.resource_id,
        quantity: effectiveDemand,
        reason: 'route_unavailable_or_no_supply',
      });
      alerts.push({
        severity: 'critical',
        type: 'route_blocked',
        target_id: node.node_id,
        message: `No local Lviv route with available stock for ${node.node_id}.`,
      });
      explanation.push(`Demand at ${node.node_id} was not planned because no warehouse can reach it with available stock.`);
      continue;
    }

    const plannedQuantity = Math.min(effectiveDemand, bestWarehouse.supply, compatibleVehicle.capacity);
    if (plannedQuantity <= 0) {
      unservedDemands.push({
        node_id: node.node_id,
        resource_id: demand.resource_id,
        quantity: effectiveDemand,
        reason: 'capacity_or_supply_limit',
      });
      continue;
    }

    const currentSupply = supplyByWarehouse.get(bestWarehouse.warehouse.node_id)?.get(demand.resource_id) ?? 0;
    supplyByWarehouse.get(bestWarehouse.warehouse.node_id)?.set(demand.resource_id, currentSupply - plannedQuantity);
    deliveredTotal += plannedQuantity;
    totalTravelTime += bestWarehouse.route.travelTimeMin;
    deliveredByVehicle.set(
      compatibleVehicle.vehicle_id,
      (deliveredByVehicle.get(compatibleVehicle.vehicle_id) ?? 0) + plannedQuantity,
    );

    const allocationIndex = allocationPlan.length;
    const allocationId = `${compatibleVehicle.vehicle_id}:${bestWarehouse.warehouse.node_id}:${node.node_id}:${demand.resource_id}:${allocationIndex}`;
    allocationPolylines[allocationId] = bestWarehouse.route.polyline;

    allocationPlan.push({
      vehicle_id: compatibleVehicle.vehicle_id,
      resource_id: demand.resource_id,
      quantity: plannedQuantity,
      from_node_id: bestWarehouse.warehouse.node_id,
      to_node_id: node.node_id,
      planned_path: bestWarehouse.route.graphNodeIds,
      eta_min: bestWarehouse.route.travelTimeMin,
      status: plannedQuantity === effectiveDemand ? 'planned' : 'partial',
    });

    if (plannedQuantity < effectiveDemand) {
      unservedDemands.push({
        node_id: node.node_id,
        resource_id: demand.resource_id,
        quantity: effectiveDemand - plannedQuantity,
        reason: 'capacity_or_supply_limit',
      });
      alerts.push({
        severity: 'warning',
        type: 'partial_delivery',
        target_id: node.node_id,
        message: `Demand at ${node.node_id} was only partially served after local rerouting.`,
      });
      explanation.push(
        `Demand at ${node.node_id} was partially served after rerouting because stock or vehicle capacity was limited.`,
      );
    } else {
      explanation.push(
        `Demand at ${node.node_id} was routed through the local Lviv graph using Dijkstra and served from ${bestWarehouse.warehouse.node_id}.`,
      );
    }
  }

  const unmetDemand = unservedDemands.reduce((total, item) => total + item.quantity, 0);
  const avgDeliveryTime = allocationPlan.length === 0 ? 0 : Math.round(totalTravelTime / allocationPlan.length);
  const score = Math.max(0, Number((100 - unmetDemand * 0.1 - alerts.length * 2).toFixed(1)));

  return {
    edges,
    edgePolylines: polylines,
    allocationPolylines,
    solution: {
      schema_version: worldState.schema_version,
      scenario_id: worldState.scenario_id,
      timestamp: new Date().toISOString(),
      objective: {
        type: worldState.execution_context.optimization_goal,
        score,
      },
      kpis: {
        total_delivered: deliveredTotal,
        unmet_demand: unmetDemand,
        vehicle_utilization: deriveVehicleUtilization(vehicles, deliveredByVehicle),
        avg_delivery_time_min: avgDeliveryTime,
      },
      allocation_plan: allocationPlan,
      unserved_demands: unservedDemands,
      alerts,
      explanation,
    },
  };
}
