import {
    OPEN_DATASET,
    LOADED_DATASET,
    INPUT_CHANGED,
    GENE_SEARCH_CHANGED,
    GENE_SEARCH_LOADED,
    GENE_SEARCH_RESET, GENE_PLOT_SUBMITTED, GENE_PLOT_LOADED_DATA,
    PATHWAY_LOADED_DATA, PATHWAY_SUBMITTED, PATHWAY_SEARCH_CHANGED, PATHWAY_SEARCH_LOADED, PATHWAY_SEARCH_RESET,
    BULK_LOADED_DATA, BULK_SUBMITTED, BULK_CHANGED
} from "../actions";
import {CHANGE_CURRENT_WINDOW, CLOSE_WINDOW} from "../actions/AppActions";

export const currentWindow = (state, action) => {
    switch (action.type) {
        case OPEN_DATASET:
        case INPUT_CHANGED:
        case GENE_SEARCH_CHANGED:
        case GENE_SEARCH_LOADED:
        case GENE_SEARCH_RESET:
        case GENE_PLOT_SUBMITTED:
        case GENE_PLOT_LOADED_DATA:
        case PATHWAY_LOADED_DATA:
        case PATHWAY_SUBMITTED:
        case PATHWAY_SEARCH_CHANGED:
        case PATHWAY_SEARCH_LOADED:
        case PATHWAY_SEARCH_RESET:
        case BULK_LOADED_DATA:
        case BULK_SUBMITTED:
        case BULK_CHANGED:
            return state.datasetsTokens.indexOf(action.token) + 1;

        case LOADED_DATASET:
            return state.datasetsTokens.length + 1;
        case CHANGE_CURRENT_WINDOW:
            return action.currentWindow;
        case CLOSE_WINDOW:
            return 0;
        default:
            return state.currentWindow
    }
};