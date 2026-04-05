import type {
  AiAnalysis,
  AiAssistantResponse,
  AiAssistantRisk,
  AiAssistantRecommendation,
  AiUserAction,
  Solution,
  WorldState,
} from '../types/types';


function getLargestEta(solution: Solution): number {
  return solution.allocation_plan.reduce((largest, plan) => Math.max(largest, plan.eta_min), 0);
}

function getMostCriticalNodeId(worldState: WorldState): string | null {
  const deliveryNodes = worldState.nodes.filter((node) => node.node_type === 'delivery_point');

  const rankedNode = deliveryNodes
    .map((node) => ({
      nodeId: node.node_id,
      score: (node.demands ?? []).reduce((total, demand) => {
        const priorityWeight =
          demand.priority === 'critical' ? 4 :
          demand.priority === 'high' || demand.priority === 'elevated' ? 3 :
          demand.priority === 'medium' || demand.priority === 'normal' ? 2 : 1;
        return total + demand.quantity * priorityWeight;
      }, 0),
    }))
    .sort((left, right) => right.score - left.score)[0];

  return rankedNode?.nodeId ?? null;
}

function getBestSourceNodeId(solution: Solution): string | null {
  return solution.allocation_plan[0]?.from_node_id ?? null;
}



function buildSummary(
  worldState: WorldState,
  solution: Solution,
  aiAnalysis: AiAnalysis,
): string {
  const parts: string[] = [];

  const connectivity = worldState.execution_context.connectivity_status;
  if (connectivity === 'unstable') {
    parts.push('Connectivity is unstable — operating in degraded mode.');
  } else if (connectivity === 'offline') {
    parts.push('Network is offline — showing last known plan.');
  }

  const blockedEdges = worldState.edges.filter((e) => e.status === 'blocked');
  if (blockedEdges.length > 0) {
    parts.push(`${blockedEdges.length} route(s) are currently blocked: ${blockedEdges.map((e) => e.edge_id).join(', ')}.`);
  }

  const criticalDemands = worldState.nodes
    .flatMap((n) => (n.demands ?? [])
        .filter((d) => d.priority === 'critical')
        .map(() => n.node_id));
  if (criticalDemands.length > 0) {
    parts.push(`Critical demand detected at: ${[...new Set(criticalDemands)].join(', ')}.`);
  }

  if (solution.kpis.unmet_demand > 0) {
    parts.push(`${solution.kpis.unmet_demand} units of demand remain unserved.`);
  }

  if (solution.kpis.total_delivered > 0) {
    parts.push(`${solution.kpis.total_delivered} units successfully allocated across ${solution.allocation_plan.length} route(s).`);
  }

  if (parts.length === 0) {
    return aiAnalysis.summary;
  }

  return parts.join(' ');
}


function buildRisks(
  worldState: WorldState,
  solution: Solution,
  aiAnalysis: AiAnalysis,
): AiAssistantRisk[] {
  const risks: AiAssistantRisk[] = [];


  const connectivity = worldState.execution_context.connectivity_status;
  if (connectivity === 'unstable' || connectivity === 'offline') {
    risks.push({
      level: connectivity === 'offline' ? 'high' : 'medium',
      type: 'connectivity_risk',
      target_id: worldState.scenario_id,
      message: connectivity === 'offline'
        ? 'Network is offline. Displaying last cached plan — data may be outdated.'
        : 'Connectivity is unstable. Real-time updates may be delayed.',
    });
  }


  const blockedEdges = worldState.edges.filter((e) => e.status === 'blocked');
  for (const edge of blockedEdges) {
    risks.push({
      level: 'high',
      type: 'route_delay',
      target_id: edge.edge_id,
      message: `Route ${edge.edge_id} from ${edge.from_node_id} to ${edge.to_node_id} is blocked. Deliveries on this path will be delayed or rerouted.`,
    });
  }


  for (const adjustment of aiAnalysis.route_risk_adjustments) {
    const alreadyReported = blockedEdges.some((e) => e.edge_id === adjustment.edge_id);
    if (!alreadyReported && adjustment.risk_score >= 0.7) {
      risks.push({
        level: adjustment.risk_score >= 0.85 ? 'high' : 'medium',
        type: 'route_delay',
        target_id: adjustment.edge_id,
        message: `Route ${adjustment.edge_id} has a risk score of ${adjustment.risk_score.toFixed(2)} and a ${adjustment.predicted_delay_multiplier.toFixed(1)}x delay multiplier. Reason: ${adjustment.reason}.`,
      });
    }
  }

  for (const unserved of solution.unserved_demands ?? []) {
    risks.push({
      level: 'high',
      type: 'demand_risk',
      target_id: unserved.node_id,
      message: `${unserved.quantity} units of ${unserved.resource_id} at ${unserved.node_id} could not be served. Reason: ${unserved.reason}.`,
    });
  }

  const totalDemand = worldState.nodes
    .flatMap((n) => n.demands ?? [])
    .reduce((sum, d) => sum + d.quantity, 0);

  const totalStock = worldState.nodes
    .flatMap((n) => n.inventory ?? [])
    .reduce((sum, i) => sum + i.quantity, 0);

  if (totalStock > 0 && totalDemand > 0 && totalStock < totalDemand * 1.1) {
    risks.push({
      level: totalStock < totalDemand ? 'high' : 'medium',
      type: 'stock_risk',
      target_id: worldState.scenario_id,
      message: `Total available stock (${totalStock}) is ${totalStock < totalDemand ? 'insufficient' : 'barely sufficient'} to cover total demand (${totalDemand}). Replenishment may be needed.`,
    });
  }


  const largestEta = getLargestEta(solution);
  if (largestEta > 30) {
    const slowestPlan = solution.allocation_plan.find((p) => p.eta_min === largestEta);
    risks.push({
      level: largestEta > 60 ? 'high' : 'medium',
      type: 'route_delay',
      target_id: slowestPlan?.to_node_id ?? worldState.scenario_id,
      message: `Longest delivery ETA is ${largestEta} min${slowestPlan ? ` for route to ${slowestPlan.to_node_id}` : ''}. Consider rerouting if time is critical.`,
    });
  }

  return risks;
}


function buildRecommendations(
  worldState: WorldState,
  solution: Solution,
  aiAnalysis: AiAnalysis,
): AiAssistantRecommendation[] {
  const recommendations: AiAssistantRecommendation[] = [];

  const blockedEdges = worldState.edges.filter((e) => e.status === 'blocked');
  for (const edge of blockedEdges) {
    recommendations.push({
      type: 'reroute',
      target_id: edge.edge_id,
      message: `Route ${edge.edge_id} is blocked. Find an alternative path from ${edge.from_node_id} to ${edge.to_node_id}.`,
    });
  }

  const criticalUnserved = (solution.unserved_demands ?? []).filter((u) => {
    const node = worldState.nodes.find((n) => n.node_id === u.node_id);
    return node?.demands?.some((d) => d.priority === 'critical');
  });
  for (const unserved of criticalUnserved) {
    recommendations.push({
      type: 'reprioritize',
      target_id: unserved.node_id,
      message: `${unserved.node_id} has unserved critical demand for ${unserved.resource_id} (${unserved.quantity} units). Allocate additional resources immediately.`,
    });
  }


  if (
    solution.kpis.vehicle_utilization < 0.6 &&
    solution.kpis.unmet_demand > 0
  ) {
    recommendations.push({
      type: 'rebalance',
      target_id: worldState.scenario_id,
      message: `Vehicle utilization is only ${(solution.kpis.vehicle_utilization * 100).toFixed(0)}% while ${solution.kpis.unmet_demand} units remain unserved. Consider redistributing vehicle assignments.`,
    });
  }


  for (const item of aiAnalysis.recommendations) {
    const alreadyCovered = recommendations.some((r) => r.target_id === item.target_id);
    if (alreadyCovered) continue;

    const type: AiAssistantRecommendation['type'] =
      item.type === 'priority_increase' ? 'reprioritize' :
      item.type === 'reroute' ? 'reroute' :
      item.type === 'monitor' ? 'monitor' : 'rebalance';

    const message = item.new_priority
      ? `Raise priority for ${item.target_id} to ${item.new_priority}.`
      : item.action
        ? `Action needed for ${item.target_id}: ${item.action.replace(/_/g, ' ')}.`
        : `Monitor ${item.target_id} for changes.`;

    recommendations.push({ type, target_id: item.target_id, message });

    if (recommendations.length >= 5) break;
  }

  if (recommendations.length === 0) {
    recommendations.push({
      type: 'monitor',
      target_id: worldState.scenario_id,
      message: 'No critical issues detected. Continue monitoring the current delivery plan.',
    });
  }

  return recommendations;
}


function buildChatAnswer(
  worldState: WorldState,
  solution: Solution,
  aiAnalysis: AiAnalysis,
  userMessage?: string,
  userAction?: AiUserAction,
): string {
  const contextParts: string[] = [];

  if (userAction && userAction.type !== 'none') {
    switch (userAction.type) {
      case 'scenario_changed':
        contextParts.push(`Scenario was switched${userAction.target_id ? ` to ${userAction.target_id}` : ''}. The system has recalculated delivery plans based on the new state.`);
        break;
      case 'add_node':
        contextParts.push(`A new node${userAction.target_id ? ` (${userAction.target_id})` : ''} was added to the network.`);
        break;
      case 'move_node':
        contextParts.push(`Node${userAction.target_id ? ` ${userAction.target_id}` : ''} was moved. Route distances and ETAs may have changed.`);
        break;
      case 'delete_node':
        contextParts.push(`Node${userAction.target_id ? ` ${userAction.target_id}` : ''} was removed from the network. Any deliveries assigned to it have been dropped.`);
        break;
    }
  }

  const stateParts: string[] = [];

  if (solution.kpis.unmet_demand > 0) {
    stateParts.push(`${solution.kpis.unmet_demand} units remain unserved`);
  }

  const blockedCount = worldState.edges.filter((e) => e.status === 'blocked').length;
  if (blockedCount > 0) {
    stateParts.push(`${blockedCount} route(s) blocked`);
  }

  if (worldState.execution_context.connectivity_status !== 'stable') {
    stateParts.push(`connectivity is ${worldState.execution_context.connectivity_status}`);
  }

  if (stateParts.length > 0) {
    contextParts.push(`Current state: ${stateParts.join(', ')}.`);
  }

  contextParts.push(aiAnalysis.summary);

  if (!userMessage) {
    return contextParts.join(' ');
  }


  const msg = userMessage.toLowerCase();

  if (msg.includes('why') && (msg.includes('unserved') || msg.includes('unmet'))) {
    const reasons = (solution.unserved_demands ?? []).map((u) => `${u.node_id}: ${u.reason}`).join('; ');
    return reasons
      ? `Unserved demand exists because: ${reasons}. ${contextParts.join(' ')}`
      : `No unserved demand at the moment. ${contextParts.join(' ')}`;
  }

  if (msg.includes('block') || msg.includes('route')) {
    const blocked = worldState.edges.filter((e) => e.status === 'blocked');
    return blocked.length > 0
      ? `Currently blocked routes: ${blocked.map((e) => `${e.edge_id} (${e.from_node_id} → ${e.to_node_id})`).join(', ')}. ${contextParts.join(' ')}`
      : `No routes are currently blocked. ${contextParts.join(' ')}`;
  }

  if (msg.includes('critical') || msg.includes('priority')) {
    const criticalNodeId = getMostCriticalNodeId(worldState);
    return criticalNodeId
      ? `The most critical delivery point is ${criticalNodeId}. ${contextParts.join(' ')}`
      : `No critical demand nodes detected right now. ${contextParts.join(' ')}`;
  }

  if (msg.includes('kpi') || msg.includes('delivered') || msg.includes('status')) {
    return `KPI summary: ${solution.kpis.total_delivered} units delivered, ${solution.kpis.unmet_demand} unmet, vehicle utilization ${(solution.kpis.vehicle_utilization * 100).toFixed(0)}%, average ETA ${solution.kpis.avg_delivery_time_min} min. ${contextParts.join(' ')}`;
  }

  if (msg.includes('stock') || msg.includes('inventory')) {
    const stockLines = worldState.nodes
      .filter((n) => n.node_type === 'warehouse' && n.inventory?.length)
      .map((n) => `${n.node_id}: ${(n.inventory ?? []).map((i) => `${i.quantity} ${i.resource_id}`).join(', ')}`);
    return stockLines.length > 0
      ? `Current warehouse stock — ${stockLines.join('; ')}. ${contextParts.join(' ')}`
      : `No warehouse inventory data available. ${contextParts.join(' ')}`;
  }


  return `${contextParts.join(' ')}`;
}


export function buildAssistantFallback(
  worldState: WorldState,
  solution: Solution,
  aiAnalysis: AiAnalysis,
  userMessage?: string,
  userAction?: AiUserAction,
): AiAssistantResponse {
  return {
    schema_version: '1.0.0',
    timestamp: new Date().toISOString(),
    scenario_id: worldState.scenario_id,
    model_info: {
      provider: 'fallback',
      model: 'heuristic-assistant-v1',
    },
    summary: buildSummary(worldState, solution, aiAnalysis),
    risks: buildRisks(worldState, solution, aiAnalysis),
    recommendations: buildRecommendations(worldState, solution, aiAnalysis),
    insights: {
      most_critical_node_id: getMostCriticalNodeId(worldState),
      best_source_node_id: getBestSourceNodeId(solution),
      largest_eta_min: getLargestEta(solution),
    },
    chat_answer: buildChatAnswer(worldState, solution, aiAnalysis, userMessage, userAction),
  };
}
