import {failedDataset, loadDataset, loadedDataset, openDataset, shouldOpen} from "./DatasetActions";
import {fetchBulkData} from "./TabActions";
import {PATHWAYS} from "../reducers/Tabs"

export const GENE_SIGNATURE_INPUT_CHANGED = "GENE_SIGNATURE_INPUT_CHANGED";
export const geneSignatureInputChanged = (name, value) => {
    return {
        type: GENE_SIGNATURE_INPUT_CHANGED,
        name,
        value
    }
};


export const GENE_SIGNATURE_RESULTS_LOADED = "GENE_SIGNATURE_RESULTS_LOADED";
export const geneSignatureResultsLoaded = (query, results) => {
    return {
        type: GENE_SIGNATURE_RESULTS_LOADED,
        query, results
    }
};


export const GENE_SIGNATURE_SUBMIT = "GENE_SIGNATURE_SUBMIT";
export const geneSignatureSubmit = () => {
    return {
        type: GENE_SIGNATURE_SUBMIT
    }
};



export const fetchGeneSignature = (speciesFrom, speciesTo, value) => {
    return function(dispatch, getState) {
        dispatch(geneSignatureSubmit());

        let genes = value.match(/\S+/g);
        let postData = {
            speciesFrom, speciesTo, genes
        };


        fetch("perform-enrichment/", {
            method: "POST",
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(postData)
        }).then(res => res.json())
            .then(data => dispatch(geneSignatureResultsLoaded(postData, data)));


    }
};


const tryFetching = (getState, dispatch, token, value) => {
    if (getState().datasetsByTokens[token].pathwaysLoaded) {
        dispatch(fetchBulkData(token, PATHWAYS, value));
    } else {
        setTimeout(() => tryFetching(getState, dispatch, token, value), 2000)
    }
};


export const showGeneSignature = (token, genes) => {
    return function(dispatch, getState) {

        if (shouldOpen(getState(), token)) {
            dispatch(openDataset(token));
            dispatch(fetchBulkData(token, PATHWAYS, genes.join(" ")));
        } else {
            dispatch(loadDataset(token));

            return fetch("scn/getDataset/?token=" + token)
                .then(res => {
                    if (res.status === 200) {
                        res.json()
                            .then(data => dispatch(loadedDataset(token, data)))
                            .then(() =>  {
                                tryFetching(getState, dispatch, token, genes.join(" "))
                            });
                    } else {
                        console.log(res);
                        dispatch(failedDataset(token));
                    }
                })
        }



    }
};