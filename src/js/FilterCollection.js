import { Filter } from "./Filter";
import { getShortest } from "./utils"

export class FilterCollection {
    constructor(layerName, filters_config, api_at){
      this.filters_config = filters_config;
      this.layerName = layerName;
      this.filters = {};
      this.api_at = api_at;
    };

    async initFilters(){
        for (let filter_config of this.filters_config){
          let filter = new Filter(filter_config);
          await filter.initSubFilters();
          this.addFilter(filter);
        }
      console.log("Initialisation des filtres terminée dans le thread FilterCollection.");
      return true;
      }

    addFilter(filter){
      this.filters[filter.name] = filter;
    }

    getFilters(){
      console.log("Filters : ", this.filters);
      console.log("Filters values from getFilters() : ", Object.values(this.filters));
      return this.filters;
    }

    getActiveFilters(){
      return Object.values(this.filters).filter(filter => filter.active == true);
    }

    async getFilteredIds(){
      let selected_features_by_filter = [];
      if (this.getActiveFilters().length){
        for (let filter of this.getActiveFilters()){
          let selected_features = await filter.getSelectedFeatures(this.api_at, this.layerName);
          console.log("Selected features from filter ", filter.name, " : ", selected_features);
          selected_features_by_filter.push(selected_features);
        }
        let shortestSelection = getShortest(selected_features_by_filter);//Returns the array that contains the smaller number of features
        console.log("Shortest selection : ", shortestSelection);
        for (let selected_features of selected_features_by_filter.filter(array => array!=shortestSelection)){
          console.log("Selected features : ", selected_features);
          for (let id of shortestSelection){
            if (!selected_features.includes(id)){
              shortestSelection = shortestSelection.filter(array_id => array_id!=id);//Removes all the ids of the smallest selection if it is not selected by the others
            }
          }
        }
        return shortestSelection;
      }
    }
      
}
