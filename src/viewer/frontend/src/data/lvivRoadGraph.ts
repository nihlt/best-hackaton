import type { Location } from '../types/types';

export interface RoadGraphNode {
  id: string;
  name: string;
  location: Location;
}

export interface RoadGraphEdge {
  from: string;
  to: string;
}

const roadGraphNodes: RoadGraphNode[] = [
  { id: 'lviv_center', name: 'Rynok Square', location: { lat: 49.8419, lng: 24.0315 } },
  { id: 'opera', name: 'Opera House', location: { lat: 49.8442, lng: 24.0266 } },
  { id: 'pidzamche', name: 'Pidzamche', location: { lat: 49.8531, lng: 24.0385 } },
  { id: 'vysokyi_zamok', name: 'Vysokyi Zamok', location: { lat: 49.8488, lng: 24.0397 } },
  { id: 'north_hub', name: 'North Ring', location: { lat: 49.8696, lng: 24.0314 } },
  { id: 'zboishcha', name: 'Zboishcha', location: { lat: 49.8795, lng: 24.0249 } },
  { id: 'holosko', name: 'Holosko', location: { lat: 49.8678, lng: 24.0084 } },
  { id: 'levandivka', name: 'Levandivka', location: { lat: 49.8398, lng: 23.9852 } },
  { id: 'railway', name: 'Railway Station', location: { lat: 49.8382, lng: 23.9946 } },
  { id: 'horodotska', name: 'Horodotska Junction', location: { lat: 49.8367, lng: 24.0128 } },
  { id: 'franko', name: 'Franko Street', location: { lat: 49.8291, lng: 24.0285 } },
  { id: 'stryiskyi_park', name: 'Stryiskyi Park', location: { lat: 49.8216, lng: 24.0268 } },
  { id: 'bus_station', name: 'Bus Station', location: { lat: 49.7986, lng: 24.0264 } },
  { id: 'sykhiv_north', name: 'Sykhiv North', location: { lat: 49.8168, lng: 24.0554 } },
  { id: 'santa_barbara', name: 'Santa Barbara', location: { lat: 49.8019, lng: 24.0678 } },
  { id: 'east_hub', name: 'East Ring', location: { lat: 49.8408, lng: 24.0792 } },
  { id: 'lykhiv', name: 'Lychakiv', location: { lat: 49.8337, lng: 24.0556 } },
  { id: 'pasichna', name: 'Pasichna', location: { lat: 49.8261, lng: 24.0718 } },
  { id: 'mayorivka', name: 'Mayorivka', location: { lat: 49.8463, lng: 24.0928 } },
  { id: 'kulparkiv', name: 'Kulparkiv', location: { lat: 49.8154, lng: 23.9978 } },
  { id: 'airport', name: 'Airport', location: { lat: 49.8126, lng: 23.9566 } },
  { id: 'rivna', name: 'Riasne Connector', location: { lat: 49.8564, lng: 23.9658 } },
  { id: 'shevchenkivskyi_hai', name: 'Shevchenkivskyi Hai', location: { lat: 49.8517, lng: 24.0577 } },
  { id: 'medyk', name: 'Pekarska Junction', location: { lat: 49.8326, lng: 24.0441 } },
  { id: 'university', name: 'University', location: { lat: 49.8391, lng: 24.0206 } },
  { id: 'arena_lviv', name: 'Arena Lviv', location: { lat: 49.7748, lng: 24.0316 } },
];

const roadGraphEdges: RoadGraphEdge[] = [
  { from: 'lviv_center', to: 'opera' },
  { from: 'lviv_center', to: 'university' },
  { from: 'lviv_center', to: 'medyk' },
  { from: 'lviv_center', to: 'franko' },
  { from: 'opera', to: 'university' },
  { from: 'opera', to: 'pidzamche' },
  { from: 'opera', to: 'horodotska' },
  { from: 'pidzamche', to: 'vysokyi_zamok' },
  { from: 'pidzamche', to: 'north_hub' },
  { from: 'pidzamche', to: 'shevchenkivskyi_hai' },
  { from: 'vysokyi_zamok', to: 'north_hub' },
  { from: 'vysokyi_zamok', to: 'shevchenkivskyi_hai' },
  { from: 'north_hub', to: 'zboishcha' },
  { from: 'north_hub', to: 'holosko' },
  { from: 'holosko', to: 'levandivka' },
  { from: 'holosko', to: 'railway' },
  { from: 'zboishcha', to: 'holosko' },
  { from: 'levandivka', to: 'railway' },
  { from: 'levandivka', to: 'rivna' },
  { from: 'railway', to: 'horodotska' },
  { from: 'railway', to: 'kulparkiv' },
  { from: 'railway', to: 'rivna' },
  { from: 'horodotska', to: 'university' },
  { from: 'horodotska', to: 'franko' },
  { from: 'horodotska', to: 'kulparkiv' },
  { from: 'franko', to: 'stryiskyi_park' },
  { from: 'franko', to: 'medyk' },
  { from: 'franko', to: 'lykhiv' },
  { from: 'stryiskyi_park', to: 'bus_station' },
  { from: 'stryiskyi_park', to: 'sykhiv_north' },
  { from: 'stryiskyi_park', to: 'kulparkiv' },
  { from: 'bus_station', to: 'arena_lviv' },
  { from: 'bus_station', to: 'santa_barbara' },
  { from: 'sykhiv_north', to: 'santa_barbara' },
  { from: 'sykhiv_north', to: 'pasichna' },
  { from: 'sykhiv_north', to: 'lykhiv' },
  { from: 'santa_barbara', to: 'arena_lviv' },
  { from: 'east_hub', to: 'mayorivka' },
  { from: 'east_hub', to: 'pasichna' },
  { from: 'east_hub', to: 'shevchenkivskyi_hai' },
  { from: 'east_hub', to: 'lykhiv' },
  { from: 'lykhiv', to: 'medyk' },
  { from: 'lykhiv', to: 'pasichna' },
  { from: 'medyk', to: 'shevchenkivskyi_hai' },
  { from: 'mayorivka', to: 'shevchenkivskyi_hai' },
  { from: 'kulparkiv', to: 'airport' },
  { from: 'kulparkiv', to: 'bus_station' },
  { from: 'rivna', to: 'airport' },
];

export { roadGraphEdges, roadGraphNodes };
