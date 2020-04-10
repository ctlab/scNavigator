import {GENE_SIGNATURE_INPUT_CHANGED, GENE_SIGNATURE_SUBMIT, GENE_SIGNATURE_RESULTS_LOADED} from "../actions";
import _ from "lodash";

export const geneSignature = (state, action) => {
    switch (action.type) {
        case GENE_SIGNATURE_SUBMIT:
            state.searchLoading = true;
            return state;
        case GENE_SIGNATURE_RESULTS_LOADED:
            state.searchLoading = false;
            state.latestQuery = action.query;
            state.searchResults = action.results;
            state.latestQuerySymbol = _.values(state.searchResults.result.geneConversionMapSymbol);
            state.latestQuerySymbol = _.filter(state.latestQuerySymbol, (a) => !_.isNil(a));
            return state;
        case GENE_SIGNATURE_INPUT_CHANGED:
            state[action.name] = action.value;
            return state;
        default:
            return state
    }
};