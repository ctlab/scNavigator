import _ from "lodash";
import { getDefaultX, getDefaultY } from "../utils/Utils";

import DatasetOverview from "../components/DatasetOverview";
import DatasetHistogram from "../components/DatasetHistogram";
import DatasetExpression from "../components/DatasetExpression";
import DatasetViolin from "../components/DatasetViolin";
import DatasetPathwayExpression from "../components/DatasetPathwayExpression";
import DatasetMarkers from "../components/DatasetMarkers";
import FilesComponent from "../components/FilesComponent";
import FilterComponent from "../components/FilterComponent";

export const OVERVIEW = "_overview";
export const HISTOGRAM = "_histogram";
export const EXPRESSION_SCATTER = "_scatter";
export const EXPRESSION_VIOLIN = "_violin";
export const PATHWAYS = "_pathways";
export const MARKERS = "_markers";
export const FILES = "_files";
export const FILTER = "_filter";

const generatePlotState = (dataset) => {
    let annotations = dataset.annotations;
    let annotationsKeys = _.keys(annotations);
    let annObj = {};

    for (let i = 0; i < annotationsKeys.length; i++) {
        annObj[annotationsKeys[i]] = false;
    }

    return {
        height: null,
        width: null,
        plot: {
            x: getDefaultX(dataset.fields.numeric),
            y: getDefaultY(dataset.fields.numeric),
            // color: null,
            split: null,
            showPlotGrid: false,
            plotPointSize: 8,
            fontSize: 16,
            annotations: annObj
        }
    }
};

export const generateOverviewState = (dataset) => {
    let plotState = generatePlotState(dataset);
    plotState.plot.color = null;
    return plotState;
};

export const generateHistogramState = (dataset) => generatePlotState(dataset);
export const generateExpressionScatterState = (dataset) => {
    let plotState = generatePlotState(dataset);
    plotState.geneValue = "";
    plotState.geneResults = [];
    plotState.isGeneLoading = false;
    plotState.plotLoading = false;

    plotState.plot.gene = null;
    plotState.plot.geneData = null;
    plotState.plot.log2 = dataset.expData.expType === "counts";
    plotState.plot.scaled = dataset.expData.expType === "counts";
    plotState.plot.zscore = false;

    return plotState;
};

export const generateExpressionViolinState = (dataset) => {
    let plotState = generateExpressionScatterState(dataset);
    plotState.plot.x = getDefaultX(dataset.fields.factor);
    return plotState;
};
export const generatePathwaysState = (dataset) => {
    let plotState = generatePlotState(dataset);

    plotState.pathwayValue = "";
    plotState.pathwayResults = [];
    plotState.isPathwayLoading = false;
    plotState.plotLoading = false;
    plotState.plot.pathway = null;
    plotState.plot.pathwayData = null;
    plotState.bulkGenes = "";
    return plotState;
};

export const generateMarkersState = (dataset) => (dataset);
export const generateFilesState = (dataset) => (dataset);
export const generateFilterState = (dataset) => (dataset);

export const defaultTabOrder = [
    OVERVIEW,
    HISTOGRAM,
    EXPRESSION_SCATTER,
    EXPRESSION_VIOLIN,
    PATHWAYS,
    MARKERS,
    FILES,
    FILTER
];




const tabRequirements = {};
tabRequirements[OVERVIEW] = ["plotDataLoaded"];
tabRequirements[HISTOGRAM] = ["plotDataLoaded"];
tabRequirements[EXPRESSION_SCATTER] = ["plotDataLoaded", "expDataLoaded"];
tabRequirements[EXPRESSION_VIOLIN] = ["plotDataLoaded", "expDataLoaded"];
tabRequirements[PATHWAYS] = ["plotDataLoaded", "expDataLoaded", "pathwaysLoaded"];
tabRequirements[MARKERS] = ["markersLoaded"];
tabRequirements[FILES] = ["filesLoaded"];
tabRequirements[FILTER] = ["plotDataLoaded"];

const tabGenerators = {};
tabGenerators[OVERVIEW] = (dataset) => generateOverviewState(dataset);
tabGenerators[HISTOGRAM] = (dataset) => generateHistogramState(dataset);
tabGenerators[EXPRESSION_SCATTER] = (dataset) => generateExpressionScatterState(dataset);
tabGenerators[EXPRESSION_VIOLIN] = (dataset) => generateExpressionViolinState(dataset);
tabGenerators[PATHWAYS] = (dataset) => generatePathwaysState(dataset);
tabGenerators[MARKERS] = (dataset) => generateMarkersState(dataset);
tabGenerators[FILES] = (dataset) => generateFilesState(dataset);
tabGenerators[FILTER] = (dataset) => generateFilterState(dataset);

export const tabNames = {};
tabNames[OVERVIEW] = "Overview";
tabNames[HISTOGRAM] = "Histogram / Bar plot";
tabNames[EXPRESSION_SCATTER] = "Expression scatter plot";
tabNames[EXPRESSION_VIOLIN] = "Expression violin plot";
tabNames[PATHWAYS] = "Pathway / Gene set plot";
tabNames[MARKERS] = "Markers";
tabNames[FILES] = "Files";
tabNames[FILTER] = "Filtering";


export const tabClasses = {};
tabClasses[OVERVIEW] = DatasetOverview;
tabClasses[HISTOGRAM] = DatasetHistogram;
tabClasses[EXPRESSION_SCATTER] = DatasetExpression;
tabClasses[EXPRESSION_VIOLIN] = DatasetViolin;
tabClasses[PATHWAYS] = DatasetPathwayExpression;
tabClasses[MARKERS] = DatasetMarkers;
tabClasses[FILES] = FilesComponent;
tabClasses[FILTER] = FilterComponent;

export const generateTabs = (dataset) => {
    let tabs = {};
    let openTabs = [];

    for (let i = 0; i < defaultTabOrder.length; i++) {
        let tab = defaultTabOrder[i];
        if (_.every(tabRequirements[tab].map(predicate => dataset[predicate]))) {
            tabs[tab] = tabGenerators[tab](dataset);
            openTabs = _.concat(openTabs, [tab])
        }
    }

    return {
        tabs,
        openTabs
    }
};


export const getOpenTabsOrdered = (openTabs) => _.filter(defaultTabOrder, tab => _.includes(openTabs, tab));
