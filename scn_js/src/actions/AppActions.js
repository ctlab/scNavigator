export const CHANGE_CURRENT_WINDOW = "CHANGE_CURRENT_WINDOW";
export const changeCurrentWindow = (currentWindow) => {
    return {
        type: CHANGE_CURRENT_WINDOW,
        currentWindow
    }
};

export const CLOSE_WINDOW = "CLOSE_WINDOW";
export const closeWindow = (dataset) => {
    return {
        type: CLOSE_WINDOW,
        dataset
    }
};