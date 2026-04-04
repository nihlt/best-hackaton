import L from 'leaflet';
import { Marker } from 'react-leaflet';
import PopupDelivery from './PopupDelivery';
import PopupWarehouse from './PopupWarehouse';
const warehouseIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2271/2271068.png',
    iconSize: [32, 32],
});
const deliveryIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1673/1673188.png',
    iconSize: [32, 32],
});

export default function MarkerWarehouse({ node }) {
    return (
        <Marker
            key={node.node_id}
            position={[node.location.lat, node.location.lng]}
            icon={node.node_type === 'warehouse' ? warehouseIcon : deliveryIcon}
        >
            {node.node_type === "warehouse" && <PopupWarehouse node={node} />}
            {node.node_type === "delivery_point" && <PopupDelivery node={node} />}


        </Marker>
    )
}
