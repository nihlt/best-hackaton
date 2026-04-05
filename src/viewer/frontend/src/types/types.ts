export type Status = 'active' | 'idle' | 'blocked' | 'open';
export type Severity = 'low' | 'medium' | 'high';
export type Priority = 'low' | 'medium' | 'high' | 'critical' | 'normal' | 'elevated';
export type NodeType = 'warehouse' | 'delivery_point' | 'supplier' | 'hub';
export type VehicleType = 'truck' | 'van' | 'special';
export type ScenarioType = 'normal' | 'demand_spike' | 'blocked_route';
export type ConnectivityStatus = 'stable' | 'unstable' | 'offline';

export interface Location {
    lat: number;
    lng: number;
}

export interface ResourceDefinition {
    resource_id: string;
    name: string;
    unit: string;
}

export interface ResourceAmount {
    resource_id: string;
    quantity: number;
}

export interface Demand extends ResourceAmount {
    priority: Priority;
}

export interface Node {
    node_id: string;
    node_type: NodeType;
    name: string;
    location: Location;
    capacity?: { storage: number };
    inventory?: ResourceAmount[];
    demands?: Demand[];
    status: Status;
}

export interface Edge {
    edge_id: string;
    from_node_id: string;
    to_node_id: string;
    distance_km: number;
    estimated_travel_time_min?: number;
    travel_time_min?: number;
    status: Status;
    risk_score: number;
}

export interface Vehicle {
    vehicle_id: string;
    vehicle_type: VehicleType;
    capacity: number;
    supported_resources: string[];
    current_node_id: string;
    status: Status | 'in_transit';
}

export interface SystemEvent {
    event_id: string;
    type: string;
    severity: Severity;
    affected_node_ids: string[];
    description: string;
}

export interface WorldState {
    schema_version: string;
    scenario_id: string;
    timestamp: string;
    execution_context: {
        connectivity_status: ConnectivityStatus;
        optimization_goal: string;
        time_horizon_minutes: number;
        currency: string;
    };
    resources: ResourceDefinition[];
    nodes: Node[];
    edges: Edge[];
    vehicles: Vehicle[];
    events: SystemEvent[];
}

export interface Solution {
    schema_version?: string;
    scenario_id?: string;
    timestamp?: string;
    objective?: {
        type: string;
        score: number;
    };
    kpis: {
        total_delivered: number;
        unmet_demand: number;
        vehicle_utilization: number;
        avg_delivery_time_min: number;
    };
    allocation_plan: {
        vehicle_id: string;
        resource_id: string;
        quantity: number;
        from_node_id: string;
        to_node_id: string;
        planned_path: string[];
        eta_min: number;
        status: string;
    }[];
    alerts: {
        severity: 'info' | 'warning' | 'critical';
        type: string;
        target_id?: string;
        message: string;
    }[];
    unserved_demands?: {
        node_id: string;
        resource_id: string;
        quantity: number;
        reason: string;
    }[];
    explanation: string[];
}

export interface AiAnalysis {
    schema_version: string;
    scenario_id: string;
    timestamp: string;
    model_info: {
        provider: string;
        model: string;
    };
    summary: string;
    demand_forecasts: {
        node_id: string;
        resource_id: string;
        predicted_quantity: number;
        confidence: number;
        reason: string;
    }[];
    route_risk_adjustments: {
        edge_id: string;
        predicted_delay_multiplier: number;
        risk_score: number;
        reason: string;
    }[];
    recommendations: {
        type: string;
        target_id: string;
        new_priority?: string;
        action?: string;
    }[];
}

export interface AiAssistantRisk {
    level: 'low' | 'medium' | 'high';
    type: 'route_delay' | 'stock_risk' | 'demand_risk' | 'connectivity_risk';
    target_id: string;
    message: string;
}

export interface AiAssistantRecommendation {
    type: 'reroute' | 'reprioritize' | 'rebalance' | 'monitor';
    target_id: string;
    message: string;
}

export interface AiAssistantInsights {
    most_critical_node_id: string | null;
    best_source_node_id: string | null;
    largest_eta_min: number;
}

export interface AiAssistantResponse {
    schema_version: string;
    timestamp: string;
    scenario_id: string;
    model_info: {
        provider: string;
        model: string;
    };
    summary: string;
    risks: AiAssistantRisk[];
    recommendations: AiAssistantRecommendation[];
    insights: AiAssistantInsights;
    chat_answer: string;
}

export interface AiUserAction {
    type: 'scenario_changed' | 'add_node' | 'move_node' | 'delete_node' | 'none';
    target_id?: string;
    message: string;
}
