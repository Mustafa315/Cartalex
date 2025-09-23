import maplibregl from 'maplibre-gl';
import { FilterCollection } from './FilterCollection.js';
import { filters_config } from './filters_config.js';
import { server_config } from './server_config.js';
import { buildFilterUI, buildLayerList, attachAllEventListeners } from './ui.js';

export class App {
  constructor(map) {
    this.map = map;
    // This will hold the collection of filters for "sitesFouilles"
    this.filterCollection = null; 
    this.popup = null;
    this.historicalMapIds = [
      "Plan Adriani (1934)",
      "Plan Tkaczow (1993)",
      "Plan Falaky (1866)"
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
    // We only initialize the filters for the 'sitesFouilles' layer
    const layerName = 'sitesFouilles';
    this.filterCollection = new FilterCollection(layerName, filters_config[layerName], server_config.api_at);
    await this.filterCollection.initFilters();
    
    // We pass the specific filters object to the UI builder
    buildFilterUI(this.filterCollection.getFilters());
  }

  initLayerList() {
    const allLayers = this.map.getStyle().layers;
    buildLayerList(allLayers, this.map, this.historicalMapIds);
  }
  
  initEventListeners() {
    // We pass the specific filters object to the event listener function
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
    const response = await fetch(`${server_config.api_at}/sitesFouilles/${fid}/details`);
    if (!response.ok) { console.error("Failed to fetch site details"); return; }
    const data = await response.json();
    let html = `<div class="site-popup"><h4>Num Tkaczow: ${data.details.num_tkaczow}</h4>`;
    if (data.details.commentaire) { html += `<p>${data.details.commentaire}</p>`; }
    if (data.vestiges.length > 0) {
      html += `<strong>Vestiges:</strong><ul>`;
      data.vestiges.forEach(v => { html += `<li>${v.caracterisation} (${v.periode || 'N/A'})</li>`; });
      html += `</ul>`;
    }
    if (data.bibliographies.length > 0) {
      html += `<strong>Bibliographie:</strong><ul>`;
      data.bibliographies.forEach(b => { html += `<li>${b.nom_document}</li>`; });
      html += `</ul>`;
    }
    html += `</div>`;
    this.popup = new maplibregl.Popup().setLngLat(coordinates).setHTML(html).addTo(this.map);
  }

  toggleLayerVisibility(layerId, isVisible) {
    const visibility = isVisible ? 'visible' : 'none';
    this.map.setLayoutProperty(layerId, 'visibility', visibility);
  }

  setLayerOpacity(layerId, opacity) {
    if (this.map.getLayer(layerId)) {
        this.map.setPaintProperty(layerId, 'raster-opacity', opacity);
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