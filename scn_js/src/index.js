import 'semantic-ui-css/semantic.min.css';

import React from 'react';
import { render } from 'react-dom';
import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import logger from 'redux-logger';
import { Provider } from 'react-redux';
import App from './containers/App';
import rootReducer from './reducers';
import {webglSupport} from "./utils/Utils";
import CookieConsent from "react-cookie-consent"


const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(
    rootReducer, composeEnhancers(
        // applyMiddleware(thunk, logger)
        applyMiddleware(thunk)
    ),
);

render(
    <Provider store={store}>
        <App />
        <CookieConsent
            location="bottom"
            buttonText="Got it"
            cookieName="acceptsCookies"
            style={{ background: "#2B373B" }}
            buttonStyle={{ color: "#4e503b", fontSize: "13px" }}
            expires={180}>
            Dear friend. We use cookies to collect anonymized statistics to make this tool even better.
        </CookieConsent>

        {!webglSupport() &&
        <CookieConsent
            location="bottom"
            buttonText="Got it"
            cookieName="acceptsWebgl"
            style={{ background: "#2B373B" }}
            buttonStyle={{ color: "#4e503b", fontSize: "13px" }}
            expires={1 / (24 * 60 * 60)}>
            Unfortunately, your browser doesn't support WebGL (or gpu acceleration is disabled). This might slow down rendering of large datasets.
            Please visit <a target="_blank" href="https://get.webgl.org/">https://get.webgl.org/</a>.
        </CookieConsent>}
    </Provider>,
    document.getElementById('root')
)
