import {GET_PUBLIC_DATASETS, GOT_PUBLIC_DATASETS} from "../actions";

export function publicDatasets(state=[], action) {
    switch (action.type) {
        case GOT_PUBLIC_DATASETS:
            console.log(action.datasets);
            return action.datasets;
        default:
            return state;
    }
}

export function publicDatasetsLoading(state=false, action) {
    switch (action.type) {
        case GET_PUBLIC_DATASETS:
            return true;
        case GOT_PUBLIC_DATASETS:
            return false;
        default:
            return state
    }
}