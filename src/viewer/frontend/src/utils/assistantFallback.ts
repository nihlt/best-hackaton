import type {
  AiAnalysis,
  AiAssistantResponse,
  AiUserAction,
  Solution,
  WorldState,
} from '../types/types';

function getLargestEta(solution: Solution) {
  return solution.allocation_plan.reduce((largest, plan) => Math.max(largest, plan.eta_min), 0);
}

function getMostCriticalNodeId(worldState: WorldState) {
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

function getBestSourceNodeId(solution: Solution) {
  return solution.allocation_plan[0]?.from_node_id ?? null;
}

export function buildAssistantFallback(
  worldState: WorldState,
  solution: Solution,
  aiAnalysis: AiAnalysis,
  userMessage?: string,
  userAction?: AiUserAction,
): AiAssistantResponse {
  const largestEta = getLargestEta(solution);
  const criticalNodeId = getMostCriticalNodeId(worldState);
  const bestSourceNodeId = getBestSourceNodeId(solution);

  return {
    schema_version: '1.0.0',
    timestamp: new Date().toISOString(),
    scenario_id: worldState.scenario_id,
    model_info: {
      provider: 'fallback',
      model: 'heuristic-assistant-v1',
    },
    summary: aiAnalysis.summary,
    risks: [
      ...(largestEta > 30
        ? [{
            level: 'medium' as const,
            type: 'route_delay' as const,
            target_id: criticalNodeId ?? worldState.scenario_id,
            message: `Largest ETA is ${largestEta} min, so that route should be monitored.`,
          }]
        : []),
      ...(solution.unserved_demands?.length
        ? [{
            level: 'high' as const,
            type: 'demand_risk' as const,
            target_id: solution.unserved_demands[0].node_id,
            message: `There is still unmet demand at ${solution.unserved_demands[0].node_id}.`,
          }]
        : []),
    ],
    recommendations: aiAnalysis.recommendations.slice(0, 3).map((item) => ({
      type:
        item.type === 'priority_increase' ? 'reprioritize' :
        item.type === 'reroute' ? 'reroute' :
        item.type === 'monitor' ? 'monitor' : 'rebalance',
      target_id: item.target_id,
      message: item.new_priority
        ? `Raise priority for ${item.target_id} to ${item.new_priority}.`
        : `${item.type} ${item.target_id}${item.action ? `: ${item.action}` : ''}.`,
    })),
    insights: {
      most_critical_node_id: criticalNodeId,
      best_source_node_id: bestSourceNodeId,
      largest_eta_min: largestEta,
    },
    chat_answer: userMessage
      ? `Current state reviewed. ${userAction?.message ?? 'No recent action was provided.'} ${aiAnalysis.summary}`
      : aiAnalysis.summary,
  };
}
