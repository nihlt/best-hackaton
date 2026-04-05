import L, { LatLng } from "leaflet";
import type { WorldState } from "../types/types";

export const getRouteMidpoint = (from: { lat: number; lng: number }, to: { lat: number; lng: number }) => {
    const fromLatLng = new LatLng(from.lat, from.lng);
    const toLatLng = new LatLng(to.lat, to.lng);

    const bounds = L.latLngBounds([fromLatLng, toLatLng]);

    const midpoint = bounds.getCenter();

    return { lat: midpoint.lat, lng: midpoint.lng };
};
export const getNodeCoords = (worldState: WorldState, nodeId: string) => {
    const node = worldState.nodes.find(n => n.node_id === nodeId);
    return node ? { lat: node.location.lat, lng: node.location.lng } : null;
};
