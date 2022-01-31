import {SINGLE_GENE_SUBMIT, SINGLE_GENE_RESULTS_LOADED, SINGLE_GENE_INPUT_CHANGED} from "../actions";

export const singleGeneSearch = (state, action) => {
    switch (action.type) {
        case SINGLE_GENE_SUBMIT:
            state.searchLoading = true;
            return state;
        case SINGLE_GENE_RESULTS_LOADED:
            state.searchLoading = false;
            state.latestQuery = action.query;
            state.searchResults = action.results;
            return state;
        case SINGLE_GENE_INPUT_CHANGED:
            state[action.name] = action.value;
            return state;
        default:
            return state
    }
};