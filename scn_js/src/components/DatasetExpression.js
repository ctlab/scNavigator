import React from 'react';
import {Grid, Form, Divider, Search, Checkbox} from 'semantic-ui-react';
import {getFields, getFieldsAndNull} from "../utils/Utils";
import {DropDownComponent} from "./InputComponents";
import {fetchGeneData, geneSearchResults, inputChanged} from "../actions";
import {connect} from "react-redux";
import AnnotationsComponent from "./AnnotationsComponent";
import OtherOptionsComponent from "./OtherOptionsComponent";
import {ScatterPlotExpressionComponent} from "./PlotComponents";


const _DatasetExpressionInputs = ({token, tab, x, y, split, asIs, scaled, log2, zscore, fields, isGeneLoading, geneResults, geneValue, dispatch}) => {
    return (<Grid.Column width={3}>
        <Form>
            <Divider horizontal>Coordinates</Divider>
            <DropDownComponent label={"X coordinate"} name={'x'} value={x} options={getFields(fields.numeric)} onChange={(e, { name, value }) => dispatch(inputChanged(token, tab, name, value))}/>
            <DropDownComponent label={"Y coordinate"} name={'y'} value={y} options={getFields(fields.numeric)} onChange={(e, { name, value }) => dispatch(inputChanged(token, tab, name, value))} />

            <Divider horizontal>Color and split</Divider>
            <Form.Field>
                <label>Select gene</label>
                <Search
                    fluid
                    name='gene'
                    loading={isGeneLoading}
                    onResultSelect={(e, { result }) => {dispatch(fetchGeneData(token, tab, result.title))}}
                    onSearchChange={(e, { value }) => {dispatch(geneSearchResults(token, tab, value))}}
                    results={geneResults}
                    value={geneValue}
                />
            </Form.Field>


            <Checkbox disabled={asIs} name='scaled' label="Scaled expression" checked={scaled} onChange={(e, { name, checked }) => dispatch(inputChanged(token, tab, name, checked))} /><br/>
            <Checkbox disabled={asIs} name='log2' label="Log-normalize" checked={log2} onChange={(e, { name, checked }) => dispatch(inputChanged(token, tab, name, checked))} /><br/>
            <Checkbox disabled={asIs} name='zscore' label="Z-score" checked={zscore} onChange={(e, { name, checked }) => dispatch(inputChanged(token, tab, name, checked))} /><br/><br/>

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
    let asIs = dataset.expData.expType === "as_is";
    const {isGeneLoading, geneResults, geneValue} = tab;
    const {x, y, split, scaled, log2, zscore} = tab.plot;
    return {
        token: ownProps.token,
        tab: ownProps.tab,
        fields: dataset.fields,
        x, y, split, asIs, scaled, log2, zscore, isGeneLoading, geneResults, geneValue
    }
};

const DatasetEpxressionInputs = connect(
    mapInputStateToProps,
    null
)(_DatasetExpressionInputs);



const _DatasetExpressionComponent = ({token, tab, windowOpen, tabOpen, plotAreaId}) => {
    if (windowOpen && tabOpen) {
        return (
            <Grid>
                <DatasetEpxressionInputs token={token} tab={tab} />
                <ScatterPlotExpressionComponent token={token} tab={tab} plotAreaId={plotAreaId}/>
            </Grid>
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
)(_DatasetExpressionComponent);