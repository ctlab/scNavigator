import _ from "lodash";


export const OPEN_DATASET = "OPEN_DATASET";
export const openDataset = (token) => {
    return {
        type: OPEN_DATASET,
        token
    }
};

export const LOAD_DATASET = "LOAD_DATASET";
export const loadDataset = (token) => {
    return {
        type: LOAD_DATASET,
        token
    }
};

export const FAILED_DATASET = "FAILED_DATASET";
export const failedDataset = (token) => {
    return {
        type: FAILED_DATASET,
        token
    }
};

export const LOADED_DATASET = "LOADED_DATASET";
export const loadedDataset = (token, dataset) => {
    return {
        type: LOADED_DATASET,
        token,
        dataset
    }
};


export const shouldOpen = (state, token) => {
  return _.includes(state.datasetsTokens, token);
};


export const fetchDataset = (token) => {
    return function(dispatch, getState) {

        if (shouldOpen(getState(), token)) {
            dispatch(openDataset(token))
        } else {
            dispatch(loadDataset(token));

            return fetch("scn/getDataset/?token=" + token)
                .then(res => {
                    if (res.status === 200) {
                        res.json().then(data => dispatch(loadedDataset(token, data)));
                    } else {
                        console.log(res);
                        dispatch(failedDataset(token));
                    }
                })
        }



    }
};


export const LOADED_PLOT_DATA = "LOADED_PLOT_DATA";
export const loadedPlotData = (token, data) => {
    return {
        type: LOADED_PLOT_DATA,
        token,
        data
    }
};

export const LOADED_MARKERS_DATA = "LOADED_MARKERS_DATA";
export const loadedMarkersData = (token, data) => {
    return {
        type: LOADED_MARKERS_DATA,
        token,
        data
    }
};


export const LOADED_EXP_DATA = "LOADED_EXP_DATA";
export const loadedExpData = (token, data) => {
    return {
        type: LOADED_EXP_DATA,
        token,
        data
    }
};

export const LOADED_PATHWAYS_DATA = "LOADED_PATHWAYS_DATA";
export const loadedPathwaysData = (token, data) => {
    return {
        type: LOADED_PATHWAYS_DATA,
        token,
        data
    }
};


export const LOADED_FILES_DATA = "LOADED_FILES_DATA";
export const loadedFilesData = (token, data) => {
    return {
        type: LOADED_FILES_DATA,
        token,
        data
    }
};

export const INPUT_CHANGED = "INPUT_CHANGED";
export const inputChanged = (token, tab, name, value) => {
    return {
        type: INPUT_CHANGED,
        token,
        tab,
        name,
        value
    }
};

export const TAB_CHANGED = "TAB_CHANGED";
export const tabChanged = (token, tab) => {
    return {
        type: TAB_CHANGED,
        token,
        tab
    }
};