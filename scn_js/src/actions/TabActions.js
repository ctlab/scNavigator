import _ from "lodash";

export const GENE_SEARCH_CHANGED = "GENE_SEARCH_CHANGED";
export const geneSearchChanged = (token, tab, geneValue) => {
    return {
        type: GENE_SEARCH_CHANGED,
        token, tab, geneValue
    }
};

export const GENE_SEARCH_LOADED = "GENE_SEARCH_LOADED";
export const geneSearchLoaded = (token, tab, geneResults) => {
    return {
        type: GENE_SEARCH_LOADED,
        token, tab, geneResults
    }
};

export const GENE_SEARCH_RESET = "GENE_SEARCH_RESET";
export const geneSearchReset = (token, tab) => {
    return {
        type: GENE_SEARCH_RESET,
        token, tab
    }
};


export const geneSearchResults = (token, tab, geneValue) => {
    return function(dispatch, getState) {
        dispatch(geneSearchChanged(token, tab, geneValue));

        setTimeout(
            () => {
                if (geneValue.length < 0) {
                    dispatch(geneSearchReset(token, tab))
                } else {
                    let regex;
                    try {
                        regex = new RegExp(geneValue, 'i');
                    }
                    catch(e) {
                        regex = new RegExp("", 'i');

                    }
                    let expData = getState().datasetsByTokens[token].expData;
                    let results = _.chain(expData.features)
                        .filter(a => regex.test(a))
                        .sortBy(a => a.length)
                        .slice(0, 10)
                        .map(title => { return {title} })
                        .value();

                    dispatch(geneSearchLoaded(token, tab, results));


                }
            }, 100
        )
    }
};


export const GENE_PLOT_SUBMITTED = "GENE_PLOT_SUBMITTED";
export const genePlotSubmitted = (token, tab, geneValue) => {
    return {
        type: GENE_PLOT_SUBMITTED,
        token, tab, geneValue
    }
};


export const GENE_PLOT_LOADED_DATA = "GENE_PLOT_LOADED_DATA";
export const genePlotLoadedData = (token, tab, geneValue, geneData) => {
    return {
        type: GENE_PLOT_LOADED_DATA,
        token, tab, geneValue, geneData
    }
};

export const fetchGeneData = (token, tab, geneValue) => {
    return function(dispatch, getState) {
        dispatch(genePlotSubmitted(token, tab, geneValue));

        let cachedGenes = getState().datasetsByTokens[token].cachedGenes;
        if (_.has(cachedGenes, geneValue)) {
            dispatch(genePlotLoadedData(token, tab, geneValue, cachedGenes[geneValue]));
        } else {
            let expData = getState().datasetsByTokens[token].expData;
            let geneIndex = expData.features.indexOf(geneValue);
            fetch("scn/getExpressionData/?token=" + token + "&gene=" + geneIndex)
                .then(res => res.json())
                .then(data => dispatch(genePlotLoadedData(token, tab, geneValue, data)));
        }

    }
};


export const PATHWAY_SEARCH_CHANGED = "PATHWAY_SEARCH_CHANGED";
export const pathwaySearchChanged = (token, tab, pathwayValue) => {
    return {
        type: PATHWAY_SEARCH_CHANGED,
        token, tab, pathwayValue
    }
};

export const PATHWAY_SEARCH_LOADED = "PATHWAY_SEARCH_LOADED";
export const pathwaySearchLoaded = (token, tab, pathwayResults) => {
    return {
        type: PATHWAY_SEARCH_LOADED,
        token, tab, pathwayResults
    }
};

export const PATHWAY_SEARCH_RESET = "PATHWAY_SEARCH_RESET";
export const pathwaySearchReset = (token, tab) => {
    return {
        type: PATHWAY_SEARCH_RESET,
        token, tab
    }
};

export const pathwaySearchResults = (token, tab, pathwayValue) => {
    return function(dispatch, getState) {
        dispatch(pathwaySearchChanged(token, tab, pathwayValue));

        setTimeout(
            () => {
                if (pathwayValue.length < 0) {
                    dispatch(pathwaySearchReset(token, tab))
                } else {
                    let regex;
                    try {
                        regex = new RegExp(pathwayValue, 'i');
                    }
                    catch(e) {
                        regex = new RegExp("", 'i');

                    }
                    let pathways = getState().datasetsByTokens[token].pathways;
                    let results = _.chain(pathways)
                        .filter(a => regex.test(a))
                        .sortBy(a => a.length)
                        .slice(0, 10)
                        .map(title => { return {title} })
                        .value();

                    dispatch(pathwaySearchLoaded(token, tab, results));


                }
            }, 100
        )
    }
};


export const PATHWAY_SUBMITTED = "PATHWAY_SUBMITTED";
export const pathwaySubmitted = (token, tab, pathwayValue) => {
    return {
        type: PATHWAY_SUBMITTED,
        token, tab, pathwayValue
    }
};


export const PATHWAY_LOADED_DATA = "PATHWAY_LOADED_DATA";
export const pathwayLoadedData = (token, tab, pathwayValue, pathwayData) => {
    return {
        type: PATHWAY_LOADED_DATA,
        token, tab, pathwayValue, pathwayData
    }
};

export const fetchPathwayData = (token, tab, pathwayValue) => {
    return function(dispatch, getState) {
        dispatch(pathwaySubmitted(token, tab, pathwayValue));

        let cachedPathways = getState().datasetsByTokens[token].cachedPathways;
        if (_.has(cachedPathways, pathwayValue)) {
            dispatch(pathwayLoadedData(token, tab, pathwayValue, cachedPathways[pathwayValue]));
        } else {
            let pathwayString = encodeURIComponent(pathwayValue);
            fetch("scn/getPathway/?token=" + token + "&pathway=" + pathwayString)
                .then(res => res.json())
                .then(data => dispatch(pathwayLoadedData(token, tab, pathwayValue, data)));
        }

    }
};

export const BULK_CHANGED = "BULK_CHANGED";
export const bulkChanged = (token, tab, bulkGenes) => {
    return {
        type: BULK_CHANGED,
        token, tab, bulkGenes
    }
};

export const BULK_SUBMITTED = "BULK_SUBMITTED";
export const bulkSubmitted = (token, tab, bulkValue) => {
    return {
        type: BULK_SUBMITTED,
        token, tab, bulkValue
    }
};


export const BULK_LOADED_DATA = "BULK_LOADED_DATA";
export const bulkLoadedData = (token, tab, genes, pathwayData) => {
    return {
        type: BULK_LOADED_DATA,
        token, tab, genes, pathwayData
    }
};

export const fetchBulkData = (token, tab, bulkValue) => {
    return function(dispatch, getState) {
        dispatch(bulkSubmitted(token, tab, bulkValue));

        let genes = bulkValue;
        let allGenes = getState().datasetsByTokens[token].expData.features;

        genes = genes.toLowerCase();
        allGenes = allGenes.map(gene => gene.toLowerCase());
        genes = genes.trim().split(/\s+/);

        let indices = genes.map(gene => allGenes.indexOf(gene));
        indices = _.filter(indices, a => a >= 0);

        let postData = {
            token: token,
            genes: indices
        };

        fetch("scn/getGeneset/", {
            method: "POST",
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(postData)
          }).then(res => res.json())
            .then(data => dispatch(bulkLoadedData(token, tab, genes, data)));
    }

};