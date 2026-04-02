function formatJsonPath(label, value) {
  return `- ${label}: ${value}`;
}

function renderSummary(worldState, solution, aiAnalysis, artifactPaths) {
  const lines = [];
  lines.push("=== Logistics Mockup Viewer ===");
  lines.push(`Scenario: ${worldState.scenario_id}`);
  lines.push(`Timestamp: ${solution.timestamp}`);
  lines.push(`Connectivity: ${worldState.execution_context.connectivity_status}`);
  lines.push("");
  lines.push("AI Summary");
  lines.push(aiAnalysis.summary);
  lines.push("");
  lines.push("KPI");
  lines.push(`- Total delivered: ${solution.kpis.total_delivered}`);
  lines.push(`- Unmet demand: ${solution.kpis.unmet_demand}`);
  lines.push(`- Vehicle utilization: ${solution.kpis.vehicle_utilization}`);
  lines.push(`- Avg delivery time (min): ${solution.kpis.avg_delivery_time_min}`);
  lines.push("");
  lines.push("Allocation Plan");

  if (solution.allocation_plan.length === 0) {
    lines.push("- No planned deliveries");
  } else {
    for (const item of solution.allocation_plan) {
      lines.push(
        `- ${item.vehicle_id}: ${item.quantity} ${item.resource_id} ${item.from_node_id} -> ${item.to_node_id} (ETA ${item.eta_min} min, ${item.status})`
      );
    }
  }

  lines.push("");
  lines.push("Alerts");
  if (solution.alerts.length === 0) {
    lines.push("- No alerts");
  } else {
    for (const alert of solution.alerts) {
      lines.push(`- [${alert.severity}] ${alert.type}: ${alert.message}`);
    }
  }

  lines.push("");
  lines.push("Explanations");
  for (const item of solution.explanation) {
    lines.push(`- ${item}`);
  }

  lines.push("");
  lines.push("Artifacts");
  lines.push(formatJsonPath("world_state", artifactPaths.worldStatePath));
  lines.push(formatJsonPath("ai_analysis", artifactPaths.aiAnalysisPath));
  lines.push(formatJsonPath("optimizer_input", artifactPaths.optimizerInputPath));
  lines.push(formatJsonPath("solution", artifactPaths.solutionPath));

  return lines.join("\n");
}

module.exports = {
  renderSummary
};
