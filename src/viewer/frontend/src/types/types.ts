export type Status = 'active' | 'idle' | 'blocked' | 'open';
export type Severity = 'low' | 'medium' | 'high';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type NodeType = 'warehouse' | 'delivery_point';
export type VehicleType = 'truck' | 'van';

export interface Location {
    lat: number;
    lng: number;
}

export interface ResourceAmount {
    resource_id: string;
    quantity: number;
}

export interface Demand extends ResourceAmount {
    priority: Priority;
}


export interface ResourceDefinition {
    resource_id: string;
    name: string;
    unit: string;
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
    estimated_travel_time_min: number;
    status: Status;
    risk_score: number;
}

export interface Vehicle {
    vehicle_id: string;
    vehicle_type: VehicleType;
    capacity: number;
    supported_resources: string[];
    current_node_id: string;
    status: Status;
}

export interface SystemEvent {
    event_id: string;
    type: string;
    severity: Severity;
    affected_node_ids: string[];
    description: string;
}

// Кореневий об'єкт схеми
export interface WorldState {
    schema_version: string;
    scenario_id: string;
    timestamp: string;
    execution_context: {
        connectivity_status: 'stable' | 'unstable' | 'offline';
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



export interface Location {
    lat: number;
    lng: number;
}

export interface Resource {
    resource_id: string;
    name?: string;
    unit: string;
    quantity: number;
    priority?: 'normal' | 'elevated' | 'critical';
}



export interface Solution {
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
        message: string;
    }[];
    explanation: string[];
}

export type ScenarioType = 'normal' | 'demand_spike' | 'blocked_route';





