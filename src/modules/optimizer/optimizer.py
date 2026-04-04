import json
import sys
from datetime import datetime, timezone

from pulp import (
    LpProblem,
    LpVariable,
    LpMinimize,
    LpBinary,
    lpSum,
    value,
    PULP_CBC_CMD,
)

PRIORITY_WEIGHT = {
    "critical": 4,
    "high": 3,
    "medium": 2,
    "low": 1,
}

UNMET_PENALTY_BASE = 100
RISK_PENALTY_SCALE = 10


def run_optimizer(data: dict) -> dict:
    schema_version = data["schema_version"]
    scenario_id = data["scenario_id"]
    objective_type = data["objective"]
    constraints = data["constraints"]

    supply_data = data["supply"]
    demand_data = data["demand"]
    routes_data = data["routes"]
    vehicles_data = data["vehicles"]

    forbidden_edges = set(constraints.get("forbidden_edge_ids", []))
    allow_partial = constraints.get("allow_partial_delivery", True)
    max_route_time = constraints.get("max_route_time_min", float("inf"))
    respect_capacity = constraints.get("respect_vehicle_capacity", True)

    resource_ids = sorted(
        {s["resource_id"] for s in supply_data}.union({d["resource_id"] for d in demand_data})
    )

    supply_by_resource = {}
    for s in supply_data:
      supply_by_resource[s["resource_id"]] = supply_by_resource.get(s["resource_id"], 0) + s["quantity"]

    route_by_dest = {}
    for r in routes_data:
        dest = r["to_node_id"]
        is_available = r.get("available", True) and r["edge_id"] not in forbidden_edges
        if not is_available:
            continue
        if r.get("travel_time_min", 0) > max_route_time:
            continue
        if dest not in route_by_dest or r.get("risk_score", 0) < route_by_dest[dest].get("risk_score", 1):
            route_by_dest[dest] = r

    vehicles = vehicles_data

    prob = LpProblem("resource_allocation", LpMinimize)

    deliver = {}
    serve = {}
    for v in vehicles:
        vid = v["vehicle_id"]
        for idx, d in enumerate(demand_data):
            key = (vid, idx)
            max_possible = min(d["quantity"], supply_by_resource.get(d["resource_id"], 0))
            deliver[key] = LpVariable(f"deliver_{vid}_{idx}", lowBound=0, upBound=max_possible)
            serve[key] = LpVariable(f"serve_{vid}_{idx}", cat=LpBinary)

    unmet = {
        idx: LpVariable(f"unmet_{idx}", lowBound=0, upBound=d["quantity"])
        for idx, d in enumerate(demand_data)
    }

    objective_terms = []

    for idx, d in enumerate(demand_data):
        weight = PRIORITY_WEIGHT.get(d.get("priority", "low"), 1)
        objective_terms.append(unmet[idx] * weight * UNMET_PENALTY_BASE)

    for v in vehicles:
        vid = v["vehicle_id"]
        for idx, d in enumerate(demand_data):
            route = route_by_dest.get(d["node_id"])
            if route:
                risk = route.get("risk_score", 0)
                objective_terms.append(deliver[(vid, idx)] * risk * RISK_PENALTY_SCALE)

    prob += lpSum(objective_terms), "total_cost"

    for resource_id, available in supply_by_resource.items():
        prob += (
            lpSum(
                deliver[(v["vehicle_id"], idx)]
                for v in vehicles
                for idx, d in enumerate(demand_data)
                if d["resource_id"] == resource_id
            ) <= available,
            f"supply_{resource_id}",
        )

    for idx, d in enumerate(demand_data):
        prob += (
            lpSum(deliver[(v["vehicle_id"], idx)] for v in vehicles) + unmet[idx] == d["quantity"],
            f"demand_balance_{idx}",
        )

    if respect_capacity:
        for v in vehicles:
            vid = v["vehicle_id"]
            prob += (
                lpSum(deliver[(vid, idx)] for idx in range(len(demand_data))) <= v["capacity"],
                f"capacity_{vid}",
            )

    for idx, d in enumerate(demand_data):
        prob += (
            lpSum(serve[(v["vehicle_id"], idx)] for v in vehicles) <= 1,
            f"single_vehicle_{idx}",
        )

    for v in vehicles:
        vid = v["vehicle_id"]
        for idx, d in enumerate(demand_data):
            prob += (
                deliver[(vid, idx)] <= d["quantity"] * serve[(vid, idx)],
                f"link_{vid}_{idx}",
            )

    for v in vehicles:
        vid = v["vehicle_id"]
        supported = set(v.get("supported_resources", resource_ids))
        for idx, d in enumerate(demand_data):
            route = route_by_dest.get(d["node_id"])
            if route is None or d["resource_id"] not in supported:
                prob += deliver[(vid, idx)] == 0, f"block_{vid}_{idx}"
                prob += serve[(vid, idx)] == 0, f"block_serve_{vid}_{idx}"

    if not allow_partial:
        for v in vehicles:
            vid = v["vehicle_id"]
            for idx, d in enumerate(demand_data):
                prob += (
                    deliver[(vid, idx)] == d["quantity"] * serve[(vid, idx)],
                    f"no_partial_{vid}_{idx}",
                )

    prob.solve(PULP_CBC_CMD(msg=0))

    allocation_plan = []
    unserved_demands = []
    alerts = []
    explanation = []
    delivered_total = 0
    total_route_time = 0
    delivered_by_vehicle = {}

    for idx, d in enumerate(demand_data):
        route = route_by_dest.get(d["node_id"])

        assigned_vehicle = None
        planned_qty = 0.0
        for v in vehicles:
            vid = v["vehicle_id"]
            qty = value(deliver[(vid, idx)]) or 0.0
            if qty > 0.001:
                assigned_vehicle = v
                planned_qty = round(qty, 2)
                break

        demand_qty = d["quantity"]
        priority = d.get("priority", "low")

        if route is None:
            unserved_demands.append({
                "node_id": d["node_id"],
                "resource_id": d["resource_id"],
                "quantity": demand_qty,
                "reason": "route_unavailable",
            })
            alerts.append({
                "severity": "critical",
                "type": "route_blocked",
                "target_id": d["node_id"],
                "message": f"No available route for {d['node_id']}.",
            })
            explanation.append(
                f"Demand at {d['node_id']} was left unserved because the route is unavailable."
            )
            continue

        if assigned_vehicle is None:
            unmet_qty = round(value(unmet[idx]) or demand_qty, 2)
            if unmet_qty > 0:
                has_compatible_vehicle = any(
                    d["resource_id"] in set(v.get("supported_resources", resource_ids))
                    for v in vehicles
                )
                reason = "insufficient_supply"
                alert_type = "stock_low"
                alert_message = f"Insufficient supply for {d['resource_id']}."

                if not has_compatible_vehicle:
                    reason = "no_compatible_vehicle"
                    alert_type = "vehicle_missing"
                    alert_message = f"No compatible vehicle for {d['resource_id']}."

                unserved_demands.append({
                    "node_id": d["node_id"],
                    "resource_id": d["resource_id"],
                    "quantity": unmet_qty,
                    "reason": reason,
                })
                alerts.append({
                    "severity": "warning",
                    "type": alert_type,
                    "target_id": d["node_id"] if reason == "no_compatible_vehicle" else d["resource_id"],
                    "message": alert_message,
                })
                explanation.append(
                    f"Demand at {d['node_id']} could not be served because supply or vehicle constraints prevented allocation."
                )
            continue

        vid = assigned_vehicle["vehicle_id"]
        travel_time = route.get("travel_time_min", 0)

        allocation_plan.append({
            "vehicle_id": vid,
            "resource_id": d["resource_id"],
            "quantity": planned_qty,
            "from_node_id": assigned_vehicle["start_node_id"],
            "to_node_id": d["node_id"],
            "planned_path": [assigned_vehicle["start_node_id"], d["node_id"]],
            "eta_min": travel_time,
            "status": "planned" if planned_qty >= demand_qty else "partial",
        })

        delivered_total += planned_qty
        total_route_time += travel_time
        delivered_by_vehicle[vid] = delivered_by_vehicle.get(vid, 0) + planned_qty

        unmet_qty = round(value(unmet[idx]) or 0, 2)
        if unmet_qty > 0:
            unserved_demands.append({
                "node_id": d["node_id"],
                "resource_id": d["resource_id"],
                "quantity": unmet_qty,
                "reason": "capacity_or_supply_limit",
            })
            alerts.append({
                "severity": "warning",
                "type": "partial_delivery",
                "target_id": d["node_id"],
                "message": f"Demand at {d['node_id']} was only partially served.",
            })
            explanation.append(
                f"Demand at {d['node_id']} was partially served because supply or vehicle capacity was limited."
            )
        else:
            explanation.append(
                f"Demand at {d['node_id']} was served because it had {priority} priority and an available route."
            )

    if forbidden_edges:
        alerts.append({
            "severity": "warning",
            "type": "degraded_mode",
            "target_id": scenario_id,
            "message": "One or more routes are forbidden. Plan generated in degraded mode.",
        })

    total_unmet = sum(item["quantity"] for item in unserved_demands)

    if vehicles:
        vehicle_utilization = round(
            sum(
                min(delivered_by_vehicle.get(v["vehicle_id"], 0), v["capacity"]) / max(v["capacity"], 1)
                for v in vehicles
            ) / len(vehicles),
            2,
        )
    else:
        vehicle_utilization = 0.0

    avg_delivery_time = round(total_route_time / len(allocation_plan)) if allocation_plan else 0
    score = round(max(0.0, 100 - total_unmet * 0.1 - len(alerts) * 2), 1)

    return {
        "schema_version": schema_version,
        "scenario_id": scenario_id,
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "objective": {
            "type": objective_type,
            "score": score,
        },
        "kpis": {
            "total_delivered": delivered_total,
            "unmet_demand": total_unmet,
            "vehicle_utilization": vehicle_utilization,
            "avg_delivery_time_min": avg_delivery_time,
        },
        "allocation_plan": allocation_plan,
        "unserved_demands": unserved_demands,
        "alerts": alerts,
        "explanation": explanation,
    }


def main():
    if len(sys.argv) != 3:
        print("Usage: python optimizer.py <optimizer_input.json> <solution.json>")
        sys.exit(1)

    input_path, output_path = sys.argv[1], sys.argv[2]

    with open(input_path, encoding="utf-8") as f:
        data = json.load(f)

    solution = run_optimizer(data)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(solution, f, indent=2, ensure_ascii=False)


if __name__ == "__main__":
    main()