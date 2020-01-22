import {fetchDataset} from "./DatasetActions";

export const CHECK_TOKEN = "CHECK_TOKEN";
export const checkToken = (token) => {
    return {
        type: CHECK_TOKEN,
        token
    }
};

export const CHECKED_TOKEN_VALID = "CHECKED_TOKEN_VALID";
export const checkedTokenValid = (token) => {
    return {
        type: CHECKED_TOKEN_VALID,
        token
    }
};

export const CHECKED_TOKEN_INVALID = "CHECKED_TOKEN_INVALID";
export const checkedTokenInvalid = (token, error) => {
    return {
        type: CHECKED_TOKEN_INVALID,
        token,
        error
    }
};


export const fetchToken = (token) => {
    return function(dispatch) {

        dispatch(checkToken(token));

        return fetch("scn/checkDataset/?token=" + token)
            .then(res => {
                if (res.status === 200) {
                    dispatch(fetchDataset(token));
                } else if (res.status === 404) {
                    dispatch(checkedTokenInvalid(token, "Token not found"));
                } else {
                    dispatch(checkedTokenInvalid(token, "Server error"));
                }
            })
    }
}
