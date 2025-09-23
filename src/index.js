import 'maplibre-gl/dist/maplibre-gl.css';
import './css/map.css';
import maplibregl from 'maplibre-gl';
import { App } from './js/app.js';

const map = new maplibregl.Map({
    container: 'map',
    style: {
        version: 8,
        sources: {
            // --- BASEMAP SOURCES ---
            osm: { type: 'raster', tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, attribution: '&copy; OpenStreetMap Contributors' },
            satellite: { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize: 256, attribution: 'Tiles &copy; Esri' },
            
            // --- TEGOLA SOURCE (POINTS) ---
            tegola_points: { type: 'vector', tiles: ['http://localhost:8080/maps/cartalex/{z}/{x}/{y}.pbf'], minzoom: 0, maxzoom: 22 },

            // --- PG_TILESERV SOURCES (ONE PER LAYER) ---
            pgts_parcelles_region: { type: 'vector', tiles: ['http://localhost:7800/public.parcelles_region/{z}/{x}/{y}.pbf'], minzoom: 0, maxzoom: 22 },
            pgts_espaces_publics: { type: 'vector', tiles: ['http://localhost:7800/public.espaces_publics/{z}/{x}/{y}.pbf'], minzoom: 0, maxzoom: 22 },
            pgts_emprises: { type: 'vector', tiles: ['http://localhost:7800/public.emprises/{z}/{x}/{y}.pbf'], minzoom: 0, maxzoom: 22 },
            pgts_noms_rues: { type: 'vector', tiles: ['http://localhost:7800/public.noms_rues/{z}/{x}/{y}.pbf'], minzoom: 0, maxzoom: 22 },
            pgts_littoral: { type: 'vector', tiles: ['http://localhost:7800/public.littoral/{z}/{x}/{y}.pbf'], minzoom: 0, maxzoom: 22 },

            // --- HISTORICAL MAP SOURCES ---
            "plan-adriani": { type: "raster", tiles: ["/adriani/{z}/{x}/{y}.png"], tileSize: 256, attribution: "Plan Adriani 1934" },
            "plan-tkaczow": { type: "raster", tiles: ["/tkaczow/{z}/{x}/{y}.png"], tileSize: 256, attribution: "Plan Tkaczow 1993" },
            "plan-falaky":  { type: "raster", tiles: ["/falaky/{z}/{x}/{y}.png"],  tileSize: 256, attribution: "Restitution de Mahmoud Bey el-Falaki, 1866" }
        },
        layers: [
            // --- BASE & HISTORICAL LAYERS ---
            { id: 'osm-background', type: 'raster', source: 'osm', layout: { 'visibility': 'visible' } },
            { id: 'satellite-background', type: 'raster', source: 'satellite', layout: { 'visibility': 'none' } },
            { id: "Plan Adriani (1934)", type: "raster", source: "plan-adriani", layout: { "visibility": "none" } },
            { id: "Plan Tkaczow (1993)", type: "raster", source: "plan-tkaczow", layout: { "visibility": "none" } },
            { id: "Plan Falaky (1866)",  type: "raster", source: "plan-falaky",  layout: { "visibility": "none" } },
            
            // --- THE CRITICAL FIX IS HERE ---
            // The 'source-layer' for pg_tileserv must match the schema and table name.
            { id: 'parcelles_region-fill', type: 'fill', source: 'pgts_parcelles_region', 'source-layer': 'public.parcelles_region', paint: { 'fill-color': 'rgba(128, 0, 128, 0.4)', 'fill-outline-color': '#303030' } },
            { id: 'espaces_publics-fill',  type: 'fill', source: 'pgts_espaces_publics',  'source-layer': 'public.espaces_publics',  paint: { 'fill-color': 'rgba(128, 0, 128, 0.92)', 'fill-outline-color': '#303030' } },
            { id: 'emprises-fill',         type: 'fill', source: 'pgts_emprises',         'source-layer': 'public.emprises',         paint: { 'fill-color': 'rgba(255, 190, 190, 0.4)', 'fill-outline-color': '#303030' } },
            { id: 'noms_rues-line',        type: 'line', source: 'pgts_noms_rues',        'source-layer': 'public.noms_rues',        paint: { 'line-color': 'rgba(100, 100, 100, 0.8)', 'line-width': 2 } },
            { id: 'littoral-line',         type: 'line', source: 'pgts_littoral',         'source-layer': 'public.littoral',         paint: { 'line-color': 'rgba(0, 100, 200, 0.8)', 'line-width': 2 } },
            
            // --- POINT LAYER from TEGOLA ---
            { id: 'sites_fouilles-points', type: 'circle', source: 'tegola_points', 'source-layer': 'sites_fouilles', paint: { 'circle-radius': 6, 'circle-color': 'rgba(0, 150, 255, 0.9)', 'circle-stroke-color': 'white', 'circle-stroke-width': 1.5 } }
        ]
    },
    center: [29.9187, 31.2001],
    zoom: 14
});

map.addControl(new maplibregl.NavigationControl());

map.on('load', () => {
  const app = new App(map);
  app.initialize();
});