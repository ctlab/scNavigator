import {failedDataset, loadDataset, loadedDataset, openDataset, shouldOpen} from "./DatasetActions";
import {fetchGeneData} from "./TabActions";
import {EXPRESSION_SCATTER} from "../reducers/Tabs"

export const SINGLE_GENE_INPUT_CHANGED = "SINGLE_GENE_INPUT_CHANGED";
export const singleGeneInputChanged = (name, value) => {
    return {
        type: SINGLE_GENE_INPUT_CHANGED,
        name,
        value
    }
};


export const SINGLE_GENE_RESULTS_LOADED = "SINGLE_GENE_RESULTS_LOADED";
export const singleGeneResultsLoaded = (query, results) => {
    return {
        type: SINGLE_GENE_RESULTS_LOADED,
        query, results
    }
};


export const SINGLE_GENE_SUBMIT = "SINGLE_GENE_SUBMIT";
export const singleGeneSubmit = () => {
    return {
        type: SINGLE_GENE_SUBMIT
    }
};



export const fetchSingleGeneCounts = (value) => {
    return function(dispatch, getState) {
        dispatch(singleGeneSubmit());

        let postData = {
            gene: value
        };

        fetch("scn/getSingleGene", {
            method: "POST",
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(postData)
        }).then(res => res.json())
            .then(data => dispatch(singleGeneResultsLoaded(postData, data)));


    }
};


const tryFetching = (getState, dispatch, token, value) => {
    if (getState().datasetsByTokens[token].expDataLoaded &&
        getState().datasetsByTokens[token].plotDataLoaded) {
        dispatch(fetchGeneData(token, EXPRESSION_SCATTER, value));
    } else {
        setTimeout(() => tryFetching(getState, dispatch, token, value), 2000)
    }
};


export const showSingleGene = (token, gene) => {
    return function(dispatch, getState) {

        if (shouldOpen(getState(), token)) {
            dispatch(openDataset(token));
            dispatch(fetchGeneData(token, EXPRESSION_SCATTER, gene));
        } else {
            dispatch(loadDataset(token));

            return fetch("scn/getDataset?token=" + token)
                .then(res => {
                    if (res.status === 200) {
                        res.json()
                            .then(data => dispatch(loadedDataset(token, data)))
                            .then(() =>  {
                                tryFetching(getState, dispatch, token, gene)
                            });
                    } else {
                        dispatch(failedDataset(token));
                    }
                })
        }
    }
};