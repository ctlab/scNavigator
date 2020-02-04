import {GENE_SIGNATURE_INPUT_CHANGED, GENE_SIGNATURE_SUBMIT, GENE_SIGNATURE_RESULTS_LOADED} from "../actions";


export const geneSignature = (state, action) => {
    switch (action.type) {
        case GENE_SIGNATURE_SUBMIT:
            state.searchLoading = true;
            return state;
        case GENE_SIGNATURE_RESULTS_LOADED:
            state.searchLoading = false;
            state.latestQuery = action.query;
            state.searchResults = action.results;
            return state;
        case GENE_SIGNATURE_INPUT_CHANGED:
            state[action.name] = action.value;
            return state;
        default:
            return state
    }
};