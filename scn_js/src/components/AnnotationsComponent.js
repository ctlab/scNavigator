import _ from "lodash";
import {Checkbox} from "semantic-ui-react";
import React from "react";
import {inputChanged} from "../actions";
import {connect} from "react-redux";

const AnnotationsComponent = ({token, plot, tab, annotations, dispatch}) => {
    const annObj = plot.annotations;
    let {x, y} = plot;
    let coords = [x, y];
    let possibleAnnotations = _.filter(_.keys(annotations),
        a => _.includes(coords, annotations[a].coords[0]) &&
            _.includes(coords, annotations[a].coords[1]));

    return possibleAnnotations.map(a => (
        <>
            <Checkbox
                name={"annotations." + a}
                label={a}
                checked={annObj[a]}
                onChange={(e, { name, checked }) => dispatch(inputChanged(token, tab, name, checked))}
            />
            <br/>
        </>
    ));
};

const mapStateToProps = (state, ownProps) => {
    let dataset = state.datasetsByTokens[ownProps.token];
    let tab = dataset.tabs[ownProps.tab];
    let plot = tab.plot;
    let annotations = dataset.annotations;
    return {
        token: ownProps.token,
        tab: ownProps.tab,
        plot, annotations
    }
};

export default connect(
    mapStateToProps,
    null
)(AnnotationsComponent);