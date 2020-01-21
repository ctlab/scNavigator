export const GET_PUBLIC_DATASETS = "GET_PUBLIC_DATASETS";
const getPublicDatasets = () => {
    return { type: GET_PUBLIC_DATASETS }
};

export const GOT_PUBLIC_DATASETS = "GOT_PUBLIC_DATASETS";
const gotPublicDatasets = (datasets) => {
    return {
        type: GOT_PUBLIC_DATASETS,
        datasets
    }
};

export const fetchPublicDatasets = () => {
    return function(dispatch) {
        dispatch(getPublicDatasets());

        return fetch("sce/getPublicDatasets", { headers: {'Accept-Encoding': 'gzip'}})
            .then(
            response => response.json(),
            error => console.log('An error occurred.', error))
            .then(json => dispatch(gotPublicDatasets(json)));
    }
};