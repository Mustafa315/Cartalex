// src/index.js (Version with Layer Switcher UI)

import './css/map.css';
import '../node_modules/ol/ol.css';

// OpenLayers Modules
import Map from 'ol/Map';
import View from 'ol/View';
import MVT from 'ol/format/MVT';
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';
import { Fill, Stroke, Style, Circle } from 'ol/style';
import OSM from 'ol/source/OSM';
import TileLayer from 'ol/layer/Tile';
import { fromLonLat } from 'ol/proj';
import { MousePosition, ScaleLine } from 'ol/control';
import { format } from 'ol/coordinate'; // <--- IMPORTANT: We need this for the mouse position

// We will re-introduce SortableJS for the drag-and-drop layer list
import Sortable from 'sortablejs';

// Filter system imports
import { FilterCollection } from './js/FilterCollection.js';
import { filters_config, api_at } from './js/filters_config.js';

/**
 * Initializes the entire map application.
 */
async function initializeApp() {
    try {
        // --- 1. DEFINE MAP STYLES ---
        const polygonStyle = new Style({
            stroke: new Stroke({ color: 'rgba(128, 0, 128, 1.0)', width: 1 }), // Purple
            fill: new Fill({ color: 'rgba(128, 0, 128, 0.3)' }),
        });

        const lineStyle = new Style({
            stroke: new Stroke({ color: 'rgba(255, 0, 0, 0.7)', width: 2 }), // Red
        });

        const pointStyle = new Style({
            image: new Circle({
                fill: new Fill({ color: 'rgba(0, 0, 255, 0.7)' }), // Blue
                radius: 5,
                stroke: new Stroke({ color: 'white', width: 1 }),
            }),
        });

        // --- 2. DEFINE MAP LAYERS ---
        const layerConfigs = [
            { name: 'emprises', title: 'Emprises', style: polygonStyle, visible: true },
            { name: 'espaces_publics', title: 'Espaces Publics', style: polygonStyle, visible: true },
            { name: 'littoral', title: 'Littoral', style: lineStyle, visible: true },
            { name: 'noms_rues', title: 'Noms des Rues', style: lineStyle, visible: true },
            { name: 'parcelles_region', title: 'Parcelles', style: polygonStyle, visible: true },
            { name: 'sites_fouilles', title: 'Sites de Fouilles', style: pointStyle, visible: true }
        ];

        const dataLayers = layerConfigs.map(config => {
            const layer = new VectorTileLayer({
                className: `layer-${config.name}`,
                declutter: true,
                source: new VectorTileSource({
                    format: new MVT(),
                    url: `http://localhost:8080/maps/cartalex/${config.name}/{z}/{x}/{y}.pbf`,
                    maxZoom: 22,
                    minZoom: 0,
                }),
                style: config.style,
                visible: config.visible,
            });
            layer.set('config', config);
            return layer;
        });

        const osmLayer = new TileLayer({ source: new OSM() });

        // --- 3. CREATE THE MAP ---
        const map = new Map({
            target: 'map',
            layers: [osmLayer, ...dataLayers],
            view: new View({
                center: fromLonLat([29.9187, 31.2001]),
                zoom: 14,
            }),
        });

        // --- 4. ADD CONTROLS ---
        map.addControl(new ScaleLine({ units: 'metric' }));
        map.addControl(new MousePosition({
            className: 'mousePosition',
            projection: 'EPSG:4326',
            coordinateFormat: (c) => `Lat/Lon: ${format(c, '{y}, {x}', 6)}`,
        }));

        // --- 5. RE-INTEGRATE YOUR UI ---
        fillLayerMenu(map, layerConfigs);

        // --- 6. INITIALIZE FILTER SYSTEM ---
        await initializeFilters();

        console.log("Map initialized successfully with layer controls.");

    } catch (err) {
        console.error('Error initializing app:', err);
        document.body.innerHTML = '<h1>Failed to load application. Please try again later.</h1>';
    }
}

/**
 * This is your original function, adapted to work with our new layerConfigs array.
 */
function fillLayerMenu(map, configs) {
    const menu = document.getElementById('items');
    menu.innerHTML = ''; // Clear previous items

    configs.forEach(config => {
        const innerHTML = `
            <li class="listitem">
                <div class="layer_infos">
                    <input class="layer_checkbox" type="checkbox" name="${config.name}" ${config.visible ? 'checked' : ''}>
                    <label for="${config.name}" class="itemLabel">${config.title}</label>
                </div>
                <ul class="layer_option" style="display:none;">
                    <li class="layer_option_item">
                        <label for="opacity-${config.name}">Opacité</label>
                        <input type="range" name="opacity" id="opacity-${config.name}" value="1" min="0" max="1" step="0.1">
                    </li>
                </ul>
            </li>`;
        menu.innerHTML += innerHTML;
    });

    // Add event listeners
    document.querySelectorAll('#items .layer_checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (evt) => onChangeLayerCheckbox(evt, map));
    });
    document.querySelectorAll('#items .itemLabel').forEach(label => {
        label.addEventListener('click', (evt) => onClickLayerLabel(evt));
    });
    document.querySelectorAll('#items input[type="range"]').forEach(range => {
        const layerName = range.closest('.listitem').querySelector('.layer_checkbox').name;
        range.addEventListener('input', (evt) => onChangeOpacityRange(evt, map, layerName));
    });

    Sortable.create(menu, {
        animation: 300,
        handle: '.itemLabel',
        onEnd: (evt) => onChangeLayerOrder(evt, map),
    });
}

function onChangeLayerCheckbox(evt, map) {
    const layerName = evt.currentTarget.name;
    const isChecked = evt.currentTarget.checked;

    map.getLayers().getArray().forEach(layer => {
        if (layer.getClassName() === `layer-${layerName}`) {
            layer.setVisible(isChecked);
        }
    });
}

function onClickLayerLabel(evt) {
    const optionsList = evt.currentTarget.parentElement.nextElementSibling;
    if (optionsList) {
        optionsList.style.display = optionsList.style.display === 'none' ? 'block' : 'none';
    }
}

function onChangeOpacityRange(evt, map, layerName) {
    const opacity = parseFloat(evt.currentTarget.value);
    map.getLayers().getArray().forEach(layer => {
        if (layer.getClassName() === `layer-${layerName}`) {
            layer.setOpacity(opacity);
        }
    });
}

function onChangeLayerOrder(evt, map) {
    const layerName = evt.item.querySelector('.layer_checkbox').name;
    const layer = map.getLayers().getArray().find(l => l.getClassName() === `layer-${layerName}`);

    if (layer) {
        const newIndexInUI = evt.newIndex;
        const totalLayers = map.getLayers().getLength();
        const newIndexInMap = totalLayers - 1 - newIndexInUI;

        map.removeLayer(layer);
        map.getLayers().insertAt(newIndexInMap, layer);
    }
}

/**
 * Initialize the filter system for the application
 */
async function initializeFilters() {
    try {
        console.log("Initializing filter system...");
        
        // Initialize filters for sitesFouilles layer
        const layerName = 'sitesFouilles';
        const filterCollection = new FilterCollection(layerName, filters_config[layerName], api_at);
        
        await filterCollection.initFilters();
        
        console.log("Filter system initialized successfully!");
        console.log("Available filters:", filterCollection.getFilters());
        
    } catch (error) {
        console.error("Error initializing filters:", error);
    }
}

// Start the application when the page is fully loaded
window.onload = initializeApp;