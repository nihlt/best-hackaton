import { Box, Paper } from '@mui/material';
import { type LatLngExpression } from 'leaflet';
import { MapContainer, TileLayer } from 'react-leaflet';
import type { Edge, Node, Solution, Vehicle, WorldState } from '../types/types';
import MarkerEdge from './shared/MarkerEdge';
import MarkerEdgePlaned from './shared/MarkerEdgePlaned';
import MarkerWarehouse from './shared/MarkerNode';
import MarkerVehicle from './shared/MarkerVehicle'; // Винеси MarkerVehicle в окремий файл

interface Props {
    worldState: WorldState,
    solution: Solution
}

const LogisticsMap = ({ worldState, solution }: Props) => {
    const position: LatLngExpression = [49.83, 24.01];

    const getNodeCoords = (nodeId: string) => {
        const node = worldState.nodes.find(n => n.node_id === nodeId);
        return node ? { lat: node.location.lat, lng: node.location.lng } : null;
    };

    return (
        <Paper sx={{ p: 1, height: "100%", flexGrow: 1, backgroundColor: 'var(--blue-slate)', borderRadius: 4 }}>
            <Box sx={{ width: '100%', height: "100%", borderRadius: 3, overflow: 'hidden', border: '2px solid #4f6272' }}>
                <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    />

                    {/* 1. Рендеринг вузлів */}
                    {worldState.nodes.map((node: Node) => (
                        <MarkerWarehouse key={node.node_id} node={node} />
                    ))}

                    {/* 2. Рендеринг статичних маршрутів мережі */}
                    {worldState.edges.map((edge: Edge) => {
                        const from = getNodeCoords(edge.from_node_id);
                        const to = getNodeCoords(edge.to_node_id);
                        if (!from || !to) return null;
                        const path: [number, number][] = [[from.lat, from.lng], [to.lat, to.lng]];
                        return <MarkerEdge key={edge.edge_id} edge={edge} isBlocked={edge.status === 'blocked'} path={path} />;
                    })}

                    {/* 3. Рендеринг запланованих шляхів доставки та ТРАНСПОРТУ В ДОРОЗІ */}
                    {solution.allocation_plan.map((plan, i) => {
                        const from = getNodeCoords(plan.from_node_id);
                        const to = getNodeCoords(plan.to_node_id);
                        if (!from || !to) return null;

                        const path: [number, number][] = [[from.lat, from.lng], [to.lat, to.lng]];

                        // Знаходимо дані про автомобіль, щоб передати в маркер
                        const vehicleData = worldState.vehicles.find(v => v.vehicle_id === plan.vehicle_id);

                        return (
                            <Box key={`plan-group-${i}`}>
                                <MarkerEdgePlaned plan={plan} path={path} i={i} />
                                {vehicleData && (
                                    <MarkerVehicle
                                        vehicle={{ ...vehicleData, status: 'in_transit' }}
                                        position={to} // Відображаємо біля цілі для наочності або посередині
                                    />
                                )}
                            </Box>
                        );
                    })}

                    {/* 4. Рендеринг транспорту, який стоїть на базах (IDLE) */}
                    {worldState.vehicles.map((vehicle: Vehicle) => {
                        // Якщо транспорт вже є в плані доставки, не малюємо його двічі як idle
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
        </Paper>
    );
};

export default LogisticsMap;