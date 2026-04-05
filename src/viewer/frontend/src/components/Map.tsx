import { Box, Chip, Paper, Stack } from '@mui/material';
import { type LatLngExpression } from 'leaflet';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import type { Edge, Node, NodeType, Solution, Vehicle, WorldState } from '../types/types';
import MarkerEdge from './shared/MarkerEdge';
import MarkerEdgePlaned from './shared/MarkerEdgePlaned';
import MarkerWarehouse from './shared/MarkerNode';
import MarkerVehicle from './shared/MarkerVehicle';

interface Props {
    worldState: WorldState,
    solution: Solution,
    edgePolylines: Record<string, { lat: number; lng: number }[]>,
    allocationPolylines: Record<string, { lat: number; lng: number }[]>,
    selectedNodeId: string | null,
    addMode: Extract<NodeType, 'warehouse' | 'delivery_point'> | null,
    onSelectNode: (nodeId: string | null) => void,
    onMoveNode: (nodeId: string, location: { lat: number; lng: number }) => void,
    onAddNode: (nodeType: Extract<NodeType, 'warehouse' | 'delivery_point'>, location: { lat: number; lng: number }) => void,
}

const MapInteractions = ({
    addMode,
    onAddNode,
    onSelectNode,
}: {
    addMode: Extract<NodeType, 'warehouse' | 'delivery_point'> | null;
    onAddNode: (nodeType: Extract<NodeType, 'warehouse' | 'delivery_point'>, location: { lat: number; lng: number }) => void;
    onSelectNode: (nodeId: string | null) => void;
}) => {
    useMapEvents({
        click(event) {
            if (addMode) {
                onAddNode(addMode, event.latlng);
                return;
            }

            onSelectNode(null);
        },
    });

    return null;
};

const LogisticsMap = ({
    worldState,
    solution,
    edgePolylines,
    allocationPolylines,
    selectedNodeId,
    addMode,
    onSelectNode,
    onMoveNode,
    onAddNode,
}: Props) => {
    const position: LatLngExpression = [49.83, 24.01];

    const getNodeCoords = (nodeId: string) => {
        const node = worldState.nodes.find(n => n.node_id === nodeId);
        return node ? { lat: node.location.lat, lng: node.location.lng } : null;
    };
    return (
        <Paper sx={{ p: 1, height: "100%", flexGrow: 1, backgroundColor: 'var(--blue-slate)', borderRadius: 4, position: 'relative' }}>
            <Box sx={{ width: '100%', height: "100%", borderRadius: 3, overflow: 'hidden', border: '2px solid #4f6272' }}>
                <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%', cursor: addMode ? 'crosshair' : 'grab' }}>
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    />
                    <MapInteractions addMode={addMode} onAddNode={onAddNode} onSelectNode={onSelectNode} />

                    {worldState.nodes.map((node: Node) => (
                        <MarkerWarehouse
                            key={node.node_id}
                            node={node}
                            isSelected={selectedNodeId === node.node_id}
                            draggable
                            eventHandlers={{
                                click: () => onSelectNode(node.node_id),
                                dragend: (event) => {
                                    const marker = event.target as L.Marker;
                                    const latLng = marker.getLatLng();
                                    onMoveNode(node.node_id, { lat: latLng.lat, lng: latLng.lng });
                                },
                            }}
                        />
                    ))}
                    {/* {worldState.edges.map((edge: Edge) => {
                        const from = getNodeCoords(edge.from_node_id);
                        const to = getNodeCoords(edge.to_node_id);
                        if (!from || !to) return null;
                        const path: [number, number][] = [[from.lat, from.lng], [to.lat, to.lng]];
                        return <MarkerEdge key={edge.edge_id} edge={edge} isBlocked={edge.status === 'blocked'} path={path} />;
                    })} */}

                    {worldState.edges.map((edge: Edge) => {
                        const polyline = edgePolylines[edge.edge_id];
                        if (!polyline?.length) return null;
                        const path: [number, number][] = polyline.map((point) => [point.lat, point.lng]);
                        return <MarkerEdge key={edge.edge_id} edge={edge} isBlocked={edge.status === 'blocked'} path={path} />;
                    })}

                    {solution.allocation_plan.map((plan, i) => {
                        const from = getNodeCoords(plan.from_node_id);
                        const to = getNodeCoords(plan.to_node_id);
                        if (!from || !to) return null;
                        const allocationId = `${plan.vehicle_id}:${plan.from_node_id}:${plan.to_node_id}:${plan.resource_id}:${i}`;
                        const polyline = allocationPolylines[allocationId];
                        const path: [number, number][] = (polyline ?? [from, to]).map((point) => [point.lat, point.lng]);

                        return (
                            <Box key={`plan-group-${i}`}>

                                {/* {vehicleData && (
                                    <MarkerVehicle
                                        vehicle={{ ...vehicleData, status: 'in_transit' }}
                                        position={midpoint} // Відображаємо біля цілі для наочності або посередині
                                    />
                                )} */}
                                <MarkerEdgePlaned plan={plan} path={path} i={i} />
                            </Box>
                        );
                    })}

                    {worldState.vehicles.map((vehicle: Vehicle) => {
                        const isMoving = solution.allocation_plan.some(p => p.vehicle_id === vehicle.vehicle_id);
                        if (isMoving) return null;

                        const coords = getNodeCoords(vehicle.current_node_id);
                        return coords ? (
                            <MarkerVehicle
                                key={`idle-${vehicle.vehicle_id}`}
                                vehicle={vehicle}
                                position={coords}
                            />
                        ) : null;
                    })}




                </MapContainer>
            </Box>
            <Stack
                direction="row"
                spacing={1}
                sx={{
                    position: 'absolute',
                    zIndex: 1000,
                    top: 24,
                    right: 24,
                }}
            >
                {addMode && (
                    <Chip
                        label={addMode === 'warehouse' ? 'Click map to add warehouse' : 'Click map to add destination'}
                        sx={{
                            backgroundColor: 'rgba(64, 78, 92, 0.92)',
                            color: '#fff',
                            border: '1px solid rgba(183,195,243,0.4)',
                        }}
                    />
                )}
                {selectedNodeId && (
                    <Chip
                        label={`Selected: ${selectedNodeId}`}
                        sx={{
                            backgroundColor: 'rgba(64, 78, 92, 0.92)',
                            color: '#fff',
                            border: '1px solid rgba(221,117,150,0.5)',
                        }}
                    />
                )}
            </Stack>
        </Paper>
    );
};

export default LogisticsMap;
