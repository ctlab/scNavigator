import React from 'react';
import {Grid, Form, Divider, Checkbox} from 'semantic-ui-react';
import { getFields, getFieldsAndNull} from "../utils/Utils";
import {DropDownComponent} from "./InputComponents";
import {inputChanged} from "../actions";
import {connect} from "react-redux";
import OtherOptionsComponent from "./OtherOptionsComponent";
import {HistogramPlotComponent} from "./PlotComponents";



const _DatasetHistogramInputs = ({token, tab, x, split, percent, fields, dispatch}) => {
    return (<Grid.Column width={3}>
        <Form>
            <Divider horizontal>Bar plot inputs</Divider>
            <DropDownComponent label={"X coordinate"} name={'x'} value={x} options={getFields(fields.all)} onChange={(e, { name, value }) => dispatch(inputChanged(token, tab, name, value))} />
            <DropDownComponent label={"Split by"} name={'split'} value={split} options={getFieldsAndNull(fields.factor)} onChange={(e, { name, value }) => dispatch(inputChanged(token, tab, name, value))} />
            <Checkbox name='percent' label="Show Percentage" checked={percent} onChange={(e, { name, checked }) => dispatch(inputChanged(token, tab, name, checked))} /><br/><br/>



            <Divider horizontal>Other</Divider>
            <OtherOptionsComponent token={token} tab={tab} />
        </Form>

    </Grid.Column>);
};

const mapInputStateToProps = (state, ownProps) => {
    let dataset = state.datasetsByTokens[ownProps.token];
    let tab = dataset.tabs[ownProps.tab];
    let {x, split, percent} = tab.plot;
    return {
        token: ownProps.token,
        tab: ownProps.tab,
        fields: dataset.fields,
        x, split, percent
    }
};

const DatasetHistogramInputs = connect(
    mapInputStateToProps,
    null
)(_DatasetHistogramInputs);



const _DatasetHistogram = ({token, tab, windowOpen, tabOpen, plotAreaId}) => {
    if (windowOpen && tabOpen) {
        return (
            (<Grid>
                <DatasetHistogramInputs token={token} tab={tab}/>
                <HistogramPlotComponent token={token} tab={tab} plotAreaId={plotAreaId}/>
            </Grid>)
        )
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
)(_DatasetHistogram);