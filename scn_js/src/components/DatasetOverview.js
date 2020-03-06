import React from 'react';
import { Grid, Form, Divider } from 'semantic-ui-react';
import {getFields, getFieldsAndNull} from "../utils/Utils";
import {DropDownComponent} from "./InputComponents";
import {inputChanged} from "../actions";
import {connect} from "react-redux";
import AnnotationsComponent from "./AnnotationsComponent";
import OtherOptionsComponent from "./OtherOptionsComponent";
import {ScatterPlotOverviewComponent} from "./PlotComponents";


const _DatasetOverviewInputs = ({token, tab, x, y, color, split, fields, dispatch}) => {
    return (<Grid.Column width={3}>
        <Form>
            <Divider horizontal>Coordinates</Divider>
            <DropDownComponent label={"X coordinate"} name={'x'} value={x} options={getFields(fields.numeric)} onChange={(e, { name, value }) => dispatch(inputChanged(token, tab, name, value))} />
            <DropDownComponent label={"Y coordinate"} name={'y'} value={y} options={getFields(fields.numeric)} onChange={(e, { name, value }) => dispatch(inputChanged(token, tab, name, value))} />

            <Divider horizontal>Color and split</Divider>
            <DropDownComponent label={"Color by"} name={'color'} value={color} options={getFieldsAndNull(fields.all)} onChange={(e, { name, value }) => dispatch(inputChanged(token, tab, name, value))} />
            <DropDownComponent label={"Split by"} name={'split'} value={split} options={getFieldsAndNull(fields.factor)} onChange={(e, { name, value }) => dispatch(inputChanged(token, tab, name, value))} />

            <Divider horizontal>Available annotations</Divider>
            <AnnotationsComponent token={token} tab={tab} />

            <Divider horizontal>Other</Divider>
            <OtherOptionsComponent token={token} tab={tab} />

        </Form>
    </Grid.Column>);
};

const mapInputStateToProps = (state, ownProps) => {
    let dataset = state.datasetsByTokens[ownProps.token];
    let tab = dataset.tabs[ownProps.tab];
    let {x, y, color, split} = tab.plot;
    return {
        token: ownProps.token,
        tab: ownProps.tab,
        fields: dataset.fields,
        x, y, color, split
    }
};

const DatasetOverviewInputs = connect(
    mapInputStateToProps,
    null
)(_DatasetOverviewInputs);


const _DatasetOverview = ({token, tab, windowOpen, tabOpen, plotAreaId}) => {
    if (windowOpen && tabOpen) {
        return (
            (<Grid>
                <DatasetOverviewInputs token={token} tab={tab}/>
                <ScatterPlotOverviewComponent token={token} tab={tab} plotAreaId={plotAreaId}/>
            </Grid>))
    } else {
        return <></>
    }
};

const mapStateToProps = (state, ownProps) => {
    let dataset = state.datasetsByTokens[ownProps.token];
    let windowOpen = (state.datasetsTokens.indexOf(ownProps.token) + 1) === state.currentWindow;
    let tabOpen = dataset.openTabs.indexOf(ownProps.tab) === dataset.currentTab;
    return {
        token: ownProps.token,
        windowOpen, tabOpen,
        tab: ownProps.tab,
        plotAreaId: ownProps.token.concat(ownProps.tab)
    }
};


export default connect(
    mapStateToProps,
    null
)(_DatasetOverview)