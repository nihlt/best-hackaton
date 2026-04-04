/** * 1. БАЗОВІ ТИПИ ТА ПЕРЕЛІКИ (ENUMS)
 */
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

/** * 2. РЕСУРСИ ТА ПОПИТ
 */
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

/** * 3. ОСНОВНІ СУТНОСТІ (ENTITIES)
 */
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

/** * 4. СТАН СВІТУ (WORLD STATE) - Вхідні дані
 */
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

/** * 5. РІШЕННЯ (SOLUTION) - Вихідні дані від алгоритму/AI
 */
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
        planned_path: string[]; // Послідовність ID вузлів
        eta_min: number;
        status: string;
    }[];
    unservedDemands:
    {
        node_id: string,
        resource_id: string,
        quantity: number,
        reason: string
    }[]

    alerts: {
        severity: 'info' | 'warning' | 'critical';
        type: string;
        message: string;
        target_id: string
    }[];
    explanation: string[];
}