import {CHECK_TOKEN, CHECKED_TOKEN_VALID, CHECKED_TOKEN_INVALID} from "../actions/TokenActions";

export function token(state={ value: "", isErrorInput: false, errorText: ""}, action) {
    switch (action.type) {
        case CHECK_TOKEN:
            return { value: action.token, isErrorInput: false, errorText: ""};
        case CHECKED_TOKEN_VALID:
            return { value: action.token, isErrorInput: false, errorText: ""};
        case CHECKED_TOKEN_INVALID:
            return { value: action.token, isErrorInput: true, errorText: action.error};
        default:
            return state
    }

}

export function tokenLoading(state=false, action) {
    switch (action.type) {
        case CHECK_TOKEN:
            return true;
        case CHECKED_TOKEN_VALID:
        case CHECKED_TOKEN_INVALID:
            return false;
        default:
            return state
    }
}