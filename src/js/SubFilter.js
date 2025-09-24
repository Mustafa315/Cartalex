import {getValuesFromSubFilter} from './server_api.js';

export class SubFilter {
    constructor(filter_name, subfilter_config){
        this.name = subfilter_config['name'];
        this.filter_name = filter_name;
        this.options = subfilter_config['options'] ? subfilter_config['options'] : {};
        this.request_options = subfilter_config['request_options'] ? subfilter_config['request_options'] : {};
        this.values = [];
        this.request_options ? this.initRequestOptions(): null;
        this.options ? this.initOptions(): null;

        // --- ADDED: Properties for numeric/date filters ---
        if (this.isNumeric) {
            this.enabled = false;
            this.floor = '';
            this.ceil = '';
        }
    }

    initRequestOptions(){
        this.alias = this.request_options.alias ? this.request_options.alias : '';
        this.order = this.request_options.order ? this.request_options.order : '';
    }

    initOptions(){
        this.isNumeric = this.options.isNumeric ? true : false;
    }

    async initValues(){
        let values;
        if(!this.isNumeric){
            values =  await getValuesFromSubFilter(this);
            console.log(`Received values for ${this.name}:`, values);
            
            if (!Array.isArray(values)) {
                console.warn(`Expected an array for ${this.name}, but received an error. Defaulting to empty.`);
                values = [];
            }
        } else {
            values = [{ ceil: null, floor: null }];
        }
        this.setValues(values);
        this.unCheckAll();
    }

    addValue(value){
        this.values.push({
            value: value,
            checked: false
        })
    }

    setValues(values){
        this.values = values;
    }

    getValues(){
        return this.values;
    }

    checkAll(){
        for(let value of this.values){
            value.checked = true;
        }
    }

    unCheckAll(){
        for(let value of this.values){
            value.checked = false;
        }
    }

    checkValue(content){
        let seekField = this.alias ? this.alias : this.name;
        try {
            const valueToUpdate = this.values.find(value => value[seekField] == content);
            if (valueToUpdate) valueToUpdate.checked = true;
        } catch (error) {
            console.log(`Error checking value: ${content}`, error)
        }
    }

    unCheckValue(content){
        let seekField = this.alias ? this.alias : this.name;
        try {
            const valueToUpdate = this.values.find(value => value[seekField] == content);
            if (valueToUpdate) valueToUpdate.checked = false;
        } catch (error) {
            console.log(`Error unchecking value: ${content}`, error)
        }
    }

    // --- ADDED: Methods to manage numeric filter state ---
    setEnabled(enabled) {
        if (this.isNumeric) {
            this.enabled = enabled;
        }
    }
    isEnabled() {
        return this.isNumeric && this.enabled;
    }
    setCeil(ceil){
        this.ceil = ceil;
    }
    getCeil(){
        return this.ceil;   
    }
    setFloor(floor){
        this.floor = floor;
    }
    getFloor(){
        return this.floor;
    }

    getSelectedValues(){
        const seekField = this.alias || this.name;
        return this.values
            .filter(value => value.checked)
            .map(value => value[seekField]);
    }
}