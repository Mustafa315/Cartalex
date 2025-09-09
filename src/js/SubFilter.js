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
    }

    initRequestOptions(){
        this.alias = this.request_options.alias ? this.request_options.alias : '';
        this.order = this.request_options.order ? this.request_options.order : '';
    }

    initOptions(){
        this.isNumeric = this.options.isNumeric ? true : false;
    }

    async initValues(){
        if(!this.isNumeric){
            var values =  await getValuesFromSubFilter(this);
            console.log("Received values : ", values)
        } else {
            var values = [
                {
                    ceil: null,
                    floor: null
                }
            ]
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
        console.log("Seek field : ", seekField);
        try {
            this.values.filter(value => value[seekField] == content)[0].checked = true;
        } catch (error) {
            console.log(`Erreur : ${content}`, error)
        }
    }

    unCheckValue(content){
        let seekField = this.alias ? this.alias : this.name;
        console.log("Seek field : ", seekField);
        try {
            this.values.filter(value => value[seekField] == content)[0].checked = false;
        } catch (error) {
            console.log(`Erreur : ${content}`, error)
        }
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
        if(this.alias){
            return this.values.filter(value => value.checked == true).map(value => value[this.alias]);
        }else {
            return this.values.filter(value => value.checked == true).map(value => value[this.name]);
        }
    }
}