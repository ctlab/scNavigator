import {
    LOADED_DATASET,
    LOADED_PLOT_DATA,
    LOADED_EXP_DATA,
    LOADED_PATHWAYS_DATA,
    LOADED_MARKERS_DATA,
    TAB_CHANGED,
    CLOSE_WINDOW,
    INPUT_CHANGED,
    GENE_SEARCH_CHANGED,
    GENE_SEARCH_LOADED,
    GENE_SEARCH_RESET,
    GENE_PLOT_SUBMITTED,
    GENE_PLOT_LOADED_DATA,
    PATHWAY_SEARCH_RESET,
    PATHWAY_SEARCH_LOADED,
    PATHWAY_SEARCH_CHANGED,
    PATHWAY_SUBMITTED,
    PATHWAY_LOADED_DATA,
    BULK_SUBMITTED,
    BULK_LOADED_DATA, BULK_CHANGED, FILTER_CHANGED_FACTOR, FILTER_LOADING, FILTER_CHANGED_NUMERIC
} from "../actions";

import _ from "lodash";
import parseFields from "../utils/Utils";
import { LOADED_FILES_DATA } from "../actions/DatasetActions";
import {generateTabs, getOpenTabsOrdered} from "./Tabs";
import {generateFilteringOptions, getFilteredIndices} from "../utils/FilteringUtils";

export function datasetsTokens(state = [], action) {
    switch (action.type) {
        case LOADED_DATASET:
            return state.concat([action.token]);

        case CLOSE_WINDOW:
            return _.filter(state, a => a !== action.dataset);

        default:
            return state;
    }
}

const createDefaultDataset = (token) => {
    return {
        token: token,
        loaded: false,

        fields: null,
        plotData: null,

        plotDataFull: null,
        fieldsFull: null,
        plotDataOrder: null,

        filterLoaded: true,

        plotDataLoaded: false,
        annotations: null,


        markers: null,
        markersLoaded: false,

        expData: null,
        expDataLoaded: false,

        cachedGenes: {},

        pathways: null,
        pathwaysLoaded: false,
        cachedPathways: {},

        files: [],
        filesLoaded: false,

        tabs: {},
        openTabs: [],
        currentTab: 0,

    }
};

export function datasetsByTokens(state = {}, action) {
    let newState;
    let newDataset;
    let tabs;
    let newTab;
    let newPlot;
    let newFields;
    let newFactorLevels;
    let newNumericRanges;
    let openTabs;
    let indices;

    switch (action.type) {
        // case LOAD_DATASET:
        //     newState = _.clone(state);
        //     newState[action.token] = createDefaultDataset(action.token);
        //     return newState;
        case LOADED_DATASET:
            newState = _.clone(state);
            newState[action.token] = Object.assign({}, createDefaultDataset(action.token), action.dataset);
            return newState;

        case LOADED_EXP_DATA:
            newState = _.clone(state);
            newDataset = _.clone(newState[action.token]);
            newDataset.expData = action.data;
            newDataset.expDataLoaded = true;
            tabs = generateTabs(newDataset);
            newDataset.tabs = tabs.tabs;
            newDataset.openTabs = tabs.openTabs;
            newState[action.token] = newDataset;
            return newState;

        case LOADED_PLOT_DATA:
            newState = _.clone(state);
            newDataset = _.clone(newState[action.token]);
            newDataset.plotDataFull = action.data.data;
            newDataset.fieldsFull = parseFields(action.data.fields);
            newDataset.fields = generateFilteringOptions(newDataset.fieldsFull);
            indices = getFilteredIndices(newDataset.plotDataFull, newDataset.fields);
            newDataset.plotDataOrder = _.shuffle(indices);
            newDataset.plotData = _.map(newDataset.plotDataOrder, (x) => newDataset.plotDataFull[x]);
            newDataset.annotations = action.data.annotations;

            newDataset.plotDataLoaded = true;
            tabs = generateTabs(newDataset);
            newDataset.tabs = tabs.tabs;
            newDataset.openTabs = tabs.openTabs;
            newState[action.token] = newDataset;
            return newState;

        case LOADED_MARKERS_DATA:
            newState = _.clone(state);
            newDataset = _.clone(newState[action.token]);
            newDataset.markers = action.data;
            newDataset.markersLoaded = true;
            tabs = generateTabs(newDataset);
            newDataset.tabs = tabs.tabs;
            newDataset.openTabs = tabs.openTabs;
            newState[action.token] = newDataset;
            return newState;

        case LOADED_PATHWAYS_DATA:
            newState = _.clone(state);
            newDataset = _.clone(newState[action.token]);
            newDataset.pathways = action.data;
            newDataset.pathwaysLoaded = true;
            tabs = generateTabs(newDataset);
            newDataset.tabs = tabs.tabs;
            newDataset.openTabs = tabs.openTabs;
            newState[action.token] = newDataset;
            return newState;

        case LOADED_FILES_DATA:
            newState = _.clone(state);
            newDataset = _.clone(newState[action.token]);
            newDataset.files = action.data;
            newDataset.filesLoaded = true;
            tabs = generateTabs(newDataset);
            newDataset.tabs = tabs.tabs;
            newDataset.openTabs = tabs.openTabs;
            newState[action.token] = newDataset;
            return newState;

        case CLOSE_WINDOW:
            newState = _.clone(state);
            delete newState[action.dataset];
            return newState;

        case INPUT_CHANGED:
            newState = _.clone(state);
            newDataset = _.clone(newState[action.token]);
            newTab = _.clone(newDataset.tabs[action.tab]);
            newPlot = _.clone(newTab.plot);
            _.set(newPlot, action.name, action.value);
            newTab.plot = newPlot;
            newDataset.tabs[action.tab] = newTab;
            openTabs = getOpenTabsOrdered(newDataset.openTabs);
            newDataset.currentTab = openTabs.indexOf(action.tab);
            newState[action.token] = newDataset;
            return newState;

        case TAB_CHANGED:
            newState = _.clone(state);
            newDataset = _.clone(newState[action.token]);
            newDataset.currentTab = action.tab;
            newState[action.token] = newDataset;
            return newState;

        // FILTERING PARTS
        case FILTER_LOADING:
            newState = _.clone(state);
            newDataset = _.clone(newState[action.token]);
            newDataset.filterLoaded = false;
            newState[action.token] = newDataset;
            return newState;

        case FILTER_CHANGED_FACTOR:
            newState = _.clone(state);
            newDataset = _.clone(newState[action.token]);
            newFields = _.clone(newDataset.fields);
            newFactorLevels = _.clone(newFields.factorLevels);

            if (_.includes(newDataset.fieldsFull.factor, action.name)) {
                if (action.checked) {
                    if (!_.includes(newFactorLevels[action.name], action.value)) {
                        newFactorLevels[action.name] =
                            _.filter(newDataset.fieldsFull.factorLevels[action.name],
                                (v) => _.includes(newFactorLevels[action.name], v)
                                    || v === action.value)
                    }
                } else {
                    if (_.includes(newFactorLevels[action.name], action.value)) {
                        newFactorLevels[action.name] =
                            _.filter(newDataset.fieldsFull.factorLevels[action.name],
                                (v) => _.includes(newFactorLevels[action.name], v)
                                    && v !== action.value)
                    }
                }
            }

            newFields.factorLevels = newFactorLevels;
            newDataset.fields = newFields;
            indices = getFilteredIndices(newDataset.plotDataFull, newDataset.fields);
            newDataset.plotDataOrder = _.shuffle(indices);
            newDataset.plotData = _.map(newDataset.plotDataOrder, (x) => newDataset.plotDataFull[x]);
            newDataset.filterLoaded = true;
            newState[action.token] = newDataset;
            return newState;

        case FILTER_CHANGED_NUMERIC:
            newState = _.clone(state);
            newDataset = _.clone(newState[action.token]);
            newFields = _.clone(newDataset.fields);
            newNumericRanges = _.clone(newFields.numericRanges);
            newNumericRanges[action.name] = action.range;
            newFields.numericRanges = newNumericRanges;
            newDataset.fields = newFields;
            indices = getFilteredIndices(newDataset.plotDataFull, newDataset.fields);
            newDataset.plotDataOrder = _.shuffle(indices);
            newDataset.plotData = _.map(newDataset.plotDataOrder, (x) => newDataset.plotDataFull[x]);
            newDataset.filterLoaded = true;
            newState[action.token] = newDataset;
            return newState;


        // GENES PARTS

        case GENE_SEARCH_CHANGED:
            newState = _.clone(state);
            newDataset = _.clone(newState[action.token]);
            newTab = _.clone(newDataset.tabs[action.tab]);
            newTab.isGeneLoading = true;
            newTab.geneValue = action.geneValue;
            newDataset.tabs[action.tab] = newTab;
            // newDataset.tabs[action.tab].isGeneLoading = true;
            // newDataset.tabs[action.tab].geneValue = action.geneValue;
            openTabs = getOpenTabsOrdered(newDataset.openTabs);
            newDataset.currentTab = openTabs.indexOf(action.tab);
            newState[action.token] = newDataset;
            return newState;

        case GENE_SEARCH_LOADED:
            newState = _.clone(state);
            newDataset = _.clone(newState[action.token]);
            newTab = _.clone(newDataset.tabs[action.tab]);
            newTab.isGeneLoading = false;
            newTab.geneResults = action.geneResults;
            newDataset.tabs[action.tab] = newTab;
            openTabs = getOpenTabsOrdered(newDataset.openTabs);
            newDataset.currentTab = openTabs.indexOf(action.tab);
            newState[action.token] = newDataset;
            return newState;

        case GENE_SEARCH_RESET:
            newState = _.clone(state);
            newDataset = _.clone(newState[action.token]);
            newTab = _.clone(newDataset.tabs[action.tab]);
            newTab.isGeneLoading = false;
            newTab.geneResults = [];
            newTab.geneValue = '';
            newDataset.tabs[action.tab] = newTab;
            openTabs = getOpenTabsOrdered(newDataset.openTabs);
            newDataset.currentTab = openTabs.indexOf(action.tab);
            newState[action.token] = newDataset;
            return newState;

        case GENE_PLOT_SUBMITTED:
            newState = _.clone(state);
            newDataset = _.clone(newState[action.token]);
            newTab = _.clone(newDataset.tabs[action.tab]);
            newTab.plotLoading = true;
            newTab.geneResults = [];
            newTab.geneValue = action.geneValue;
            newDataset.tabs[action.tab] = newTab;
            openTabs = getOpenTabsOrdered(newDataset.openTabs);
            newDataset.currentTab = openTabs.indexOf(action.tab);
            newState[action.token] = newDataset;
            return newState;

        case GENE_PLOT_LOADED_DATA:
            newState = _.clone(state);
            newDataset = _.clone(newState[action.token]);
            newTab = _.clone(newDataset.tabs[action.tab]);
            newFields = _.clone(newDataset.fields);
            newPlot = _.clone(newTab.plot);

            if (!_.has(newDataset.cachedGenes, action.geneValue)) {
                newDataset.cachedGenes[action.geneValue] = action.geneData;
                let range = [_.min(action.geneData), _.max(action.geneData)];

                newDataset.fieldsFull.numeric.push(action.geneValue);
                newDataset.fieldsFull.numericRanges[action.geneValue] = range;

                newFields.numeric.push(action.geneValue);
                newFields.numericRanges[action.geneValue] = range;
            }

            newTab.plotLoading = false;
            newPlot.gene = action.geneValue;


            newTab.plot = newPlot;
            newDataset.tabs[action.tab] = newTab;
            newDataset.fields = newFields;
            openTabs = getOpenTabsOrdered(newDataset.openTabs);
            newDataset.currentTab = openTabs.indexOf(action.tab);
            newState[action.token] = newDataset;
            return newState;


        // PATHWAYS

        case PATHWAY_SEARCH_CHANGED:
            newState = _.clone(state);
            newDataset = _.clone(newState[action.token]);
            newTab = _.clone(newDataset.tabs[action.tab]);
            newTab.isPathwayLoading = true;
            newTab.pathwayValue = action.pathwayValue;
            newDataset.tabs[action.tab] = newTab;
            openTabs = getOpenTabsOrdered(newDataset.openTabs);
            newDataset.currentTab = openTabs.indexOf(action.tab);
            newState[action.token] = newDataset;
            return newState;

        case PATHWAY_SEARCH_LOADED:
            newState = _.clone(state);
            newDataset = _.clone(newState[action.token]);
            newTab = _.clone(newDataset.tabs[action.tab]);
            newTab.isPathwayLoading = false;
            newTab.pathwayResults = action.pathwayResults;
            newDataset.tabs[action.tab] = newTab;
            openTabs = getOpenTabsOrdered(newDataset.openTabs);
            newDataset.currentTab = openTabs.indexOf(action.tab);
            newState[action.token] = newDataset;
            return newState;

        case PATHWAY_SEARCH_RESET:
            newState = _.clone(state);
            newDataset = _.clone(newState[action.token]);
            newTab = _.clone(newDataset.tabs[action.tab]);
            newTab.isPathwayLoading = false;
            newTab.pathwayResults = [];
            newTab.pathwayValue = '';
            newDataset.tabs[action.tab] = newTab;
            openTabs = getOpenTabsOrdered(newDataset.openTabs);
            newDataset.currentTab = openTabs.indexOf(action.tab);
            newState[action.token] = newDataset;
            return newState;

        case PATHWAY_SUBMITTED:
            newState = _.clone(state);
            newDataset = _.clone(newState[action.token]);
            newTab = _.clone(newDataset.tabs[action.tab]);
            newTab.plotLoading = true;
            newTab.pathwayResults = [];
            newTab.pathwayValue = action.pathwayValue;
            newDataset.tabs[action.tab] = newTab;
            openTabs = getOpenTabsOrdered(newDataset.openTabs);
            newDataset.currentTab = openTabs.indexOf(action.tab);
            newState[action.token] = newDataset;
            return newState;

        case PATHWAY_LOADED_DATA:
            newState = _.clone(state);
            newDataset = _.clone(newState[action.token]);
            newTab = _.clone(newDataset.tabs[action.tab]);
            newFields = _.clone(newDataset.fields);
            newPlot = _.clone(newTab.plot);

            if (!_.has(newDataset.cachedPathways, action.pathwayValue)) {
                newDataset.cachedPathways[action.pathwayValue] = action.pathwayData;

                let range = [_.min(action.pathwayData), _.max(action.pathwayData)];

                newDataset.fieldsFull.numeric.push(action.pathwayValue);
                newDataset.fieldsFull.numericRanges[action.pathwayValue] = range;

                newFields.numeric.push(action.pathwayValue);
                newFields.numericRanges[action.pathwayValue] = range;
            }

            newTab.plotLoading = false;
            newPlot.pathway = action.pathwayValue;

            newTab.plot = newPlot;
            newDataset.tabs[action.tab] = newTab;
            newDataset.fields = newFields;
            openTabs = getOpenTabsOrdered(newDataset.openTabs);
            newDataset.currentTab = openTabs.indexOf(action.tab);
            newState[action.token] = newDataset;
            return newState;


        case BULK_CHANGED:
            newState = _.clone(state);
            newDataset = _.clone(newState[action.token]);
            newTab = _.clone(newDataset.tabs[action.tab]);
            newTab.bulkGenes = action.bulkGenes;
            newDataset.tabs[action.tab] = newTab;
            // newDataset.tabs[action.tab].isGeneLoading = true;
            // newDataset.tabs[action.tab].geneValue = action.geneValue;
            openTabs = getOpenTabsOrdered(newDataset.openTabs);
            newDataset.currentTab = openTabs.indexOf(action.tab);
            newState[action.token] = newDataset;
            return newState;

        case BULK_SUBMITTED:
            newState = _.clone(state);
            newDataset = _.clone(newState[action.token]);
            newTab = _.clone(newDataset.tabs[action.tab]);
            newTab.plotLoading = true;
            newDataset.tabs[action.tab] = newTab;
            openTabs = getOpenTabsOrdered(newDataset.openTabs);
            newDataset.currentTab = openTabs.indexOf(action.tab);
            newState[action.token] = newDataset;
            return newState;

        case BULK_LOADED_DATA:
            newState = _.clone(state);
            newDataset = _.clone(newState[action.token]);
            newTab = _.clone(newDataset.tabs[action.tab]);
            newFields = _.clone(newDataset.fields);
            newPlot = _.clone(newTab.plot);


            newTab.plotLoading = false;
            newPlot.pathway = action.genes.join(", ");

            if (!_.has(newDataset.cachedPathways, newPlot.pathway)) {
                newDataset.cachedPathways[newPlot.pathway] = action.pathwayData;

                let range = [_.min(action.pathwayData), _.max(action.pathwayData)];

                newDataset.fieldsFull.numeric.push(newPlot.pathway);
                newDataset.fieldsFull.numericRanges[newPlot.pathway] = range;

                newFields.numeric.push(newPlot.pathway);
                newFields.numericRanges[newPlot.pathway] = range;
            }

            newTab.plot = newPlot;
            newDataset.tabs[action.tab] = newTab;
            newDataset.fields = newFields;
            openTabs = getOpenTabsOrdered(newDataset.openTabs);
            newDataset.currentTab = openTabs.indexOf(action.tab);
            newState[action.token] = newDataset;
            return newState;


        default:
            return state
    }
}