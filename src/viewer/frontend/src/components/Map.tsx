import { Box, Paper } from '@mui/material';
import L, { type LatLngExpression } from 'leaflet';
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';
import type { Edge, Node } from '../types/types';
import PopupWarehouse from './PopupWarehouse';
import PopupDelivery from './PopupDelivery';

const warehouseIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2271/2271068.png',
    iconSize: [32, 32],
});

const deliveryIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1673/1673188.png',
    iconSize: [32, 32],
});

const LogisticsMap = ({ worldState, solution }) => {
    const position: LatLngExpression = [49.83, 24.01];

    return (
        <Paper sx={{ p: 1, height: "100%", flexGrow: 1, backgroundColor: 'var(--blue-slate)', borderRadius: 4 }}>

            <Box sx={{ width: '100%', height: "100%", borderRadius: 3, overflow: 'hidden', border: '2px solid #4f6272' }}>
                <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" // Темна карта під твій стиль
                        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    />

                    {worldState.nodes.map((node: Node) => (
                        <Marker
                            key={node.node_id}
                            position={[node.location.lat, node.location.lng]}
                            icon={node.node_type === 'warehouse' ? warehouseIcon : deliveryIcon}
                        >
                            {node.node_type === "warehouse" && <PopupWarehouse node={node} />}
                            {node.node_type === "delivery_point" && <PopupDelivery node={node} />}


                        </Marker>
                    ))}

                    {worldState.edges.map((edge: Edge) => {
                        const fromNode = worldState.nodes.find(n => n.node_id === edge.from_node_id);
                        const toNode = worldState.nodes.find(n => n.node_id === edge.to_node_id);

                        if (!fromNode || !toNode) return null;

                        const isBlocked = edge.status === 'blocked';

                        return (
                            <Polyline
                                key={edge.edge_id}
                                positions={[
                                    [fromNode.location.lat, fromNode.location.lng],
                                    [toNode.location.lat, toNode.location.lng]
                                ]}
                                pathOptions={{
                                    color: isBlocked ? '#cf1259' : '#b7c3f3',
                                    weight: isBlocked ? 5 : 3,
                                    dashArray: isBlocked ? '10, 10' : '0'
                                }}
                            >
                                <Popup>
                                    Маршрут: {edge.edge_id} <br />
                                    Статус: {edge.status} <br />
                                    Ризик: {edge.risk_score} <br />
                                    Довжина: {edge.distance_km}км
                                </Popup>
                            </Polyline>
                        );
                    })}
                </MapContainer>
            </Box>
        </Paper>
    );
};

export default LogisticsMap;