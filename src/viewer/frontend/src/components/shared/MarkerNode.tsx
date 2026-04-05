import L from 'leaflet';
import type { LeafletEventHandlerFnMap } from 'leaflet';
import { Marker } from 'react-leaflet';
import type { Node } from '../../types/types';
import PopupDelivery from './PopupDelivery';
import PopupWarehouse from './PopupWarehouse';

const warehouseIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2271/2271068.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
});
const deliveryIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1673/1673188.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
});

const selectedWarehouseIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2271/2271068.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
});

const selectedDeliveryIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1673/1673188.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
});

interface MarkerNodeProps {
    node: Node;
    isSelected?: boolean;
    draggable?: boolean;
    eventHandlers?: LeafletEventHandlerFnMap;
}

export default function MarkerWarehouse({ node, isSelected = false, draggable = false, eventHandlers }: MarkerNodeProps) {
    const icon = node.node_type === 'warehouse'
        ? (isSelected ? selectedWarehouseIcon : warehouseIcon)
        : (isSelected ? selectedDeliveryIcon : deliveryIcon);

    return (
        <Marker
            key={node.node_id}
            position={[node.location.lat, node.location.lng]}
            icon={icon}
            draggable={draggable}
            eventHandlers={eventHandlers}
            zIndexOffset={isSelected ? 1000 : 0}
        >
            {node.node_type === "warehouse" && <PopupWarehouse node={node} />}
            {node.node_type === "delivery_point" && <PopupDelivery node={node} />}
        </Marker>
    )
}
