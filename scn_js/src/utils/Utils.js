import _ from 'lodash';
import React from "react";

export default function parseFields(fields) {
    let numeric = [];
    let factor = [];
    let factorLevels = {};
    let numericRanges = {};

    let fieldNames = _.keys(fields);

    for (let i = 0; i < fieldNames.length; i++) {
        if (fields[fieldNames[i]].type === "numeric") {
            numeric.push(fieldNames[i]);
            numericRanges[fieldNames[i]] = fields[fieldNames[i]].range;

        }
        if (fields[fieldNames[i]].type === "factor") {
            factor.push(fieldNames[i]);
            factorLevels[fieldNames[i]] = fields[fieldNames[i]].levels;
        }
    }

    fields = {
        all: fieldNames,
        numeric,
        factor,
        factorLevels,
        numericRanges

    };
    return fields;
}


let umapPattern = /umap/i;
let tsnePattern = /tsne/i;

export function getDefaultX(fields) {
    let umapFields = _.filter(fields, a => umapPattern.test(a)).sort();
    let tsneFields = _.filter(fields, a => tsnePattern.test(a)).sort();
    return (umapFields.length >= 2 ? umapFields[0] :
        tsneFields.length >= 2 ? tsneFields[0] : fields[0])
}

export function getDefaultY(fields) {
    let umapFields = _.filter(fields, a => umapPattern.test(a)).sort();
    let tsneFields = _.filter(fields, a => tsnePattern.test(a)).sort();
    return (umapFields.length >= 2 ? umapFields[1] :
        tsneFields.length >= 1 ? tsneFields[1] : fields[1])
}

export function getFields(fields) {
    return fields.map(a => {return {text: a, value: a}})
}

export function getFieldsAndNull(fields) {
    let nf = getFields(fields);
    return [{text: "None", value: null}].concat(nf);
}

export function uniqueValues(vals) {
    return vals.filter((value, index, self) => self.indexOf(value) === index);
}

export function which(arr, fun) {
    let res = [];
    for (let i = 0; i < arr.length; i++)
        if (fun(arr[i])) res.push(i);
    return res;
}

export function expandRange(range) {
    let rangeSize = range[1] - range[0];
    let range5 = 0.05 * rangeSize;
    let ans = [];
    ans[0] = range[0] - range5;
    ans[1] = range[1] + range5;
    return ans;
}


export function caseInsensetiveRegexpFiltering(filter, row) {
    let regex;
    try {
        regex = new RegExp(filter.value, 'i');
    }
    catch(e) {
        regex = new RegExp("", 'i');

    }
    return (regex.test(row[filter.id]));
}



// taken from https://stackoverflow.com/questions/11871077/proper-way-to-detect-webgl-support
export function webglSupport () {
    try {
        let canvas = document.createElement('canvas');
        let webglContext = !!window.WebGLRenderingContext &&
            (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        return webglContext !== null;
    } catch(e) {
        return false;
    }
};

export const FilterLabel = (label) => ({filter, onChange}) => (
    <div className="ui labeled fluid input">
        <div className="ui label">
            {label}
        </div>
        <input
            fluid
            type="text"
            onChange={event => onChange(event.target.value)}/>
    </div>);