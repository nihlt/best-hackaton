import json
import os
import sys
from datetime import datetime, timezone

# pip install python-dotenv
from dotenv import load_dotenv

# pip install google-generativeai
import google.generativeai as genai


load_dotenv()

# 3. Беремо правильну назву змінної.
# Якщо в .env написано API_KEY=твоє_значення, то тут пишемо "API_KEY"
GEMINI_API_KEY = os.environ.get("API_KEY", "YOUR_API_KEY_HERE")
GEMINI_MODEL = "gemini-2.5-flash-lite"


SYSTEM_PROMPT = """
You are a logistics risk analysis AI assistant.
You will receive a JSON object describing the current state of a logistics network (world_state).
Your task is to analyze it and return a structured JSON analysis.

You MUST return ONLY a valid JSON object — no markdown, no backticks, no explanation.
The JSON must strictly match the following schema:

{
  "schema_version": "1.0.0",
  "scenario_id": "<same as input>",
  "timestamp": "<current ISO 8601 UTC timestamp>",
  "model_info": {
    "provider": "google",
    "model": "gemini-2.0-flash"
  },
  "summary": "<1-2 sentence summary of the situation>",
  "demand_forecasts": [
    {
      "node_id": "<delivery point node_id>",
      "resource_id": "<resource_id>",
      "predicted_quantity": <integer>,
      "confidence": <float between 0 and 1>,
      "reason": "<short explanation>"
    }
  ],
  "route_risk_adjustments": [
    {
      "edge_id": "<edge_id>",
      "predicted_delay_multiplier": <float, e.g. 1.0 means no delay>,
      "risk_score": <float between 0 and 1>,
      "reason": "<short explanation>"
    }
  ],
  "recommendations": [
    {
      "type": "<priority_increase | reroute | degraded_mode | monitor>",
      "target_id": "<node_id or edge_id or scenario_id>",
      "new_priority": "<critical | high | normal>",  // only for priority_increase
      "action": "<avoid_if_possible | use_last_valid_snapshot | keep_baseline_plan | monitor>"  // only for reroute / degraded_mode / monitor
    }
  ]
}

Rules:
- Include a demand_forecast entry for EVERY demand in EVERY delivery_point node.
- Include a route_risk_adjustment entry for EVERY edge.
- Base predicted_quantity on the original demand quantity, adjusted upward based on events and context.
- confidence must be between 0.5 and 0.95.
- risk_score must be between 0.0 and 0.99.
- predicted_delay_multiplier must be >= 1.0.
- recommendations must have at least one entry.
- For priority_increase recommendations include "new_priority".
- For reroute / degraded_mode / monitor recommendations include "action".
- Do not include both "new_priority" and "action" in the same recommendation object.
- Do not output anything outside the JSON object.
"""


def build_user_prompt(world_state: dict) -> str:
    return f"Analyze the following logistics network state and return the JSON analysis:\n\n{json.dumps(world_state, indent=2)}"



def rule_based_fallback(world_state: dict) -> dict:
    """
    Used when Gemini is unavailable or returns invalid JSON.
    Replicates the logic from mock-ai.js in Python.
    """
    events = world_state.get("events", [])
    edges = world_state.get("edges", [])
    nodes = world_state.get("nodes", [])
    connectivity = world_state.get("execution_context", {}).get("connectivity_status", "stable")

    delivery_nodes = [n for n in nodes if n.get("node_type") == "delivery_point"]

    # Demand forecasts
    demand_forecasts = []
    for node in delivery_nodes:
        relevant_events = [
            e for e in events
            if node["node_id"] in e.get("affected_node_ids", [])
            or e["type"] in ("demand_spike", "connectivity_loss")
        ]

        for demand in node.get("demands", []):
            multiplier = 1.0
            reason = "Base demand"

            for event in relevant_events:
                if event["type"] == "demand_spike":
                    multiplier = max(multiplier, 1.5)
                    reason = event.get("description", "Demand spike detected")
                elif event["type"] == "weather_alert":
                    multiplier = max(multiplier, 1.2)
                    reason = event.get("description", "Weather alert")
                elif event["type"] == "road_block":
                    multiplier = max(multiplier, 1.1)
                    reason = event.get("description", "Road block nearby")

            if connectivity == "unstable":
                multiplier += 0.05
                reason += "; conservative uplift due to unstable connectivity"

            confidence = round(max(0.55, 0.9 - (multiplier - 1) * 0.2), 2)
            predicted_quantity = int(demand["quantity"] * multiplier + 0.999)  # ceil

            demand_forecasts.append({
                "node_id": node["node_id"],
                "resource_id": demand["resource_id"],
                "predicted_quantity": predicted_quantity,
                "confidence": confidence,
                "reason": reason
            })

    # Route risk adjustments
    route_risk_adjustments = []
    for edge in edges:
        risk_score = edge.get("risk_score", 0.1)
        delay_multiplier = 1.0 + risk_score
        reason = "Baseline route assessment"

        for event in events:
            if event["type"] == "road_block" and edge.get("status") == "blocked":
                risk_score = max(risk_score, 0.98)
                delay_multiplier = max(delay_multiplier, 2.2)
                reason = event.get("description", "Road block")
            elif event["type"] == "connectivity_loss":
                risk_score = max(risk_score, 0.65)
                delay_multiplier = max(delay_multiplier, 1.35)
                reason = event.get("description", "Connectivity loss")
            elif event["type"] == "demand_spike":
                risk_score = max(risk_score, edge.get("risk_score", 0.1) + 0.1)
                delay_multiplier = max(delay_multiplier, 1.15)
                reason = "Higher dispatch pressure on the route"

        route_risk_adjustments.append({
            "edge_id": edge["edge_id"],
            "predicted_delay_multiplier": round(delay_multiplier, 2),
            "risk_score": round(min(0.99, risk_score), 2),
            "reason": reason
        })

    # Recommendations
    recommendations = []
    for forecast in demand_forecasts:
        recommendations.append({
            "type": "priority_increase",
            "target_id": forecast["node_id"],
            "new_priority": "critical"
        })
    for route in route_risk_adjustments:
        recommendations.append({
            "type": "reroute",
            "target_id": route["edge_id"],
            "action": "avoid_if_possible" if route["risk_score"] >= 0.8 else "monitor"
        })
    if connectivity == "unstable":
        recommendations.append({
            "type": "degraded_mode",
            "target_id": world_state.get("scenario_id", "unknown"),
            "action": "use_last_valid_snapshot"
        })
    if not recommendations:
        recommendations.append({
            "type": "monitor",
            "target_id": world_state.get("scenario_id", "unknown"),
            "action": "keep_baseline_plan"
        })

    # Summary
    summary_parts = []
    if any(e["type"] == "demand_spike" for e in events):
        summary_parts.append("Demand spike detected and critical deliveries reprioritized.")
    if any(e.get("status") == "blocked" for e in edges):
        summary_parts.append("Blocked route detected; avoid affected edges if possible.")
    if connectivity == "unstable":
        summary_parts.append("Connectivity is unstable; degraded mode fallback should be available.")
    if not summary_parts:
        summary_parts.append("Network looks stable; proceed with baseline allocation.")

    return {
        "schema_version": world_state.get("schema_version", "1.0.0"),
        "scenario_id": world_state.get("scenario_id", "unknown"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "model_info": {
            "provider": "rule-based-fallback",
            "model": "heuristic-v1"
        },
        "summary": " ".join(summary_parts),
        "demand_forecasts": demand_forecasts,
        "route_risk_adjustments": route_risk_adjustments,
        "recommendations": recommendations
    }



REQUIRED_TOP_LEVEL_KEYS = {
    "schema_version", "scenario_id", "timestamp", "model_info",
    "summary", "demand_forecasts", "route_risk_adjustments", "recommendations"
}


def validate_ai_analysis(data: dict) -> bool:
    if not isinstance(data, dict):
        return False
    if not REQUIRED_TOP_LEVEL_KEYS.issubset(data.keys()):
        missing = REQUIRED_TOP_LEVEL_KEYS - data.keys()
        print(f"[validation] Missing keys: {missing}", file=sys.stderr)
        return False
    if not isinstance(data["demand_forecasts"], list):
        return False
    if not isinstance(data["route_risk_adjustments"], list):
        return False
    if not isinstance(data["recommendations"], list):
        return False
    return True




def run_ai(world_state: dict) -> dict:
    """
    Main entry point.
    Tries Gemini first, falls back to rule-based if anything goes wrong.
    """
    api_key = GEMINI_API_KEY
    if not api_key or api_key == "YOUR_API_KEY_HERE":
        print("[ai] No API key set — using rule-based fallback.", file=sys.stderr)
        return rule_based_fallback(world_state)

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(
            model_name=GEMINI_MODEL,
            system_instruction=SYSTEM_PROMPT,
            generation_config=genai.GenerationConfig(
                temperature=0.2,
                response_mime_type="application/json",
            )
        )

        user_prompt = build_user_prompt(world_state)
        response = model.generate_content(user_prompt)
        raw_text = response.text.strip()

        # Strip markdown fences if Gemini adds them anyway
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
            raw_text = raw_text.strip()

        result = json.loads(raw_text)

        if not validate_ai_analysis(result):
            print("[ai] Gemini response failed validation — using fallback.", file=sys.stderr)
            return rule_based_fallback(world_state)

        # Always stamp with current time and correct model info
        result["timestamp"] = datetime.now(timezone.utc).isoformat()
        result["model_info"] = {"provider": "google", "model": GEMINI_MODEL}

        print("[ai] Gemini analysis complete.", file=sys.stderr)
        return result

    except json.JSONDecodeError as e:
        print(f"[ai] JSON parse error: {e} — using fallback.", file=sys.stderr)
        return rule_based_fallback(world_state)
    except Exception as e:
        print(f"[ai] Gemini error: {e} — using fallback.", file=sys.stderr)
        return rule_based_fallback(world_state)




def main():
    """
    Usage:
        python ai_module.py <path_to_world_state.json> [path_to_output_ai_analysis.json]

    If output path is not provided, prints to stdout.
    """
    if len(sys.argv) < 2:
        print("Usage: python ai_module.py <world_state.json> [ai_analysis.json]", file=sys.stderr)
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None

    with open(input_path, "r", encoding="utf-8") as f:
        world_state = json.load(f)

    result = run_ai(world_state)

    output_json = json.dumps(result, indent=2, ensure_ascii=False)

    if output_path:
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(output_json)
        print(f"[ai] Written to {output_path}", file=sys.stderr)
    else:
        print(output_json)


if __name__ == "__main__":
    main()
