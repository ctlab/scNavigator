import _ from "lodash";


export function generateFilteringOptions(fields) {
    return _.cloneDeep(fields)
}

export function getFilteredIndices(plotData, fields) {
    let predicate = (i) => {
        let x = plotData[i];
        for (let key in fields.factorLevels) {
            if (!_.includes(fields.factorLevels[key], x[key])) return false;
        }
        for (let key in fields.numericRanges) {
            if (fields.numericRanges[key][0] > x[key] || x[key] > fields.numericRanges[key][1]) return false;
        }
        return true;
    };
    return _.partition(_.range(plotData.length), predicate)[0];
}