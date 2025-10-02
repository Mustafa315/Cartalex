import maplibregl from 'maplibre-gl';
import { FilterCollection } from './FilterCollection.js';
import { filters_config } from './filters_config.js';
import { server_config } from './server_config.js';
import { buildFilterUI, buildLayerList, attachAllEventListeners } from './ui.js';

export class App {
  constructor(map) {
    this.map = map;
    this.filterCollection = null; 
    this.popup = null;
    this.historicalMapIds = [
      "Plan d'Adriani, 1934",
      "Plan de Tkaczow, 1993",
      "Restitution de Mahmoud bey el-Falaki, 1866" 
    ];
  }

  async initialize() {
    console.log('Initializing application...');
    try {
      await this.initFilters();
      this.initLayerList();
      this.initEventListeners();
      this.initMapClickListener();
      console.log('Application initialized successfully.');
    } catch (error) {
      console.error("Failed to initialize the application:", error);
    }
  }

  async initFilters() {
    const layerName = 'sitesFouilles';
    this.filterCollection = new FilterCollection(layerName, filters_config[layerName], server_config.api_at);
    await this.filterCollection.initFilters();
    buildFilterUI(this.filterCollection.getFilters());
  }

  initLayerList() {
    const allLayers = this.map.getStyle().layers;
    buildLayerList(allLayers, this.map, this.historicalMapIds);
  }
  
  initEventListeners() {
    attachAllEventListeners(
      this.filterCollection.getFilters(),
      async () => { await this.updateMapFilter(); },
      (layerId, isVisible) => { this.toggleLayerVisibility(layerId, isVisible); },
      (layerId, opacity) => { this.setLayerOpacity(layerId, opacity); }
    );
  }

  initMapClickListener() {
    this.map.on('click', 'sites_fouilles-points', (e) => {
      if (this.popup) { this.popup.remove(); }
      const feature = e.features[0];
      const coordinates = feature.geometry.coordinates.slice();
      const fid = feature.id;
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }
      this.showPopupForSite(fid, coordinates);
    });
    this.map.on('mouseenter', 'sites_fouilles-points', () => { this.map.getCanvas().style.cursor = 'pointer'; });
    this.map.on('mouseleave', 'sites_fouilles-points', () => { this.map.getCanvas().style.cursor = ''; });
  }

  async showPopupForSite(fid, coordinates) {
    try {
        const response = await fetch(`${server_config.api_at}/sitesFouilles/${fid}/details`);
        if (!response.ok) {
            throw new Error(`API request failed for fid: ${fid}`);
        }
        const data = await response.json();

        // 1. Build the main title string like the online site
        const discoverer = data.details.inventeur || '';
        const discoveryDate = data.details.date_decouverte || '';
        const title = `<b>Fouilles ${discoverer} (${discoveryDate})</b><br>Num Tkaczow: ${data.details.num_tkaczow}`;
        
        let html = `<div class="site-popup"><h4>${title}</h4>`;

        // 2. Build the Vestiges list with simplified formatting
        if (data.vestiges && data.vestiges.length > 0) {
            html += `<strong>Vestiges:</strong><ul>`;
            data.vestiges.forEach(v => {
                const period = v.periode ? v.periode.split(' (')[0] : 'N/A';
                html += `<li>${v.caracterisation} (${period})</li>`;
            });
            html += `</ul>`;
        }

        // 3. Build the full, formatted bibliography citation
        if (data.bibliographies && data.bibliographies.length > 0) {
            html += `<strong>Bibliographie sélective:</strong><ul>`;
            data.bibliographies.forEach(b => {
                const author = b.auteur || '';
                const docTitle = b.nom_document ? `“${b.nom_document}”` : '';
                const year = b.annee || '';
                const page = b.pages || '0';
                html += `<li>${author}, ${docTitle}, ${year}, ${page}.</li>`;
            });
            html += `</ul>`;
        }

        html += `</div>`;
        
        this.popup = new maplibregl.Popup().setLngLat(coordinates).setHTML(html).addTo(this.map);

    } catch (error) {
        console.error("Error creating popup:", error);
    }
  }

  toggleLayerVisibility(layerId, isVisible) {
    const visibility = isVisible ? 'visible' : 'none';
    this.map.setLayoutProperty(layerId, 'visibility', visibility);
  }

  setLayerOpacity(layerId, opacity) {
    const layer = this.map.getLayer(layerId);
    if (!layer) {
      console.warn(`Attempted to set opacity on a non-existent layer: ${layerId}`);
      return;
    }
    if (layer.type === 'raster') {
      this.map.setPaintProperty(layerId, 'raster-opacity', opacity);
    } else if (layer.type === 'fill') {
      this.map.setPaintProperty(layerId, 'fill-opacity', opacity);
    } else {
      console.warn(`Layer type "${layer.type}" does not support opacity control.`);
    }
  }

  async updateMapFilter() {
    const activeFilters = this.filterCollection.getActiveFilters();
    if (activeFilters.length === 0) {
      this.map.setFilter('sites_fouilles-points', null);
      return;
    }
    const filteredIdsAsString = await this.filterCollection.getFilteredIds();
    const filteredIds = filteredIdsAsString.map(id => Number(id));
    if (filteredIds && filteredIds.length > 0) {
      const filter = ['in', ['id'], ['literal', filteredIds]];
      this.map.setFilter('sites_fouilles-points', filter);
    } else {
      this.map.setFilter('sites_fouilles-points', ['in', ['id'], '']);
    }
  }
}
