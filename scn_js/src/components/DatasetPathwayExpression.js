import React from 'react';
import {Grid, Form, Divider, Search, TextArea, Button} from 'semantic-ui-react';
import {getFields, getFieldsAndNull} from "../utils/Utils";
import {DropDownComponent} from "./InputComponents";
import {fetchPathwayData, pathwaySearchResults, fetchBulkData, inputChanged, bulkChanged} from "../actions";
import AnnotationsComponent from "./AnnotationsComponent";
import OtherOptionsComponent from "./OtherOptionsComponent";
import {connect} from "react-redux";
import {ScatterPlotPathwayComponent} from "./PlotComponents";


const _PathwayInputs = ({token, tab, x, y, split, fields, isPathwayLoading, pathwayResults, pathwayValue, bulkGenes, dispatch}) => {
    return (
        <Grid.Column width={3}>
            <Form>
                <Divider horizontal>Coordinates</Divider>
                <DropDownComponent label={"X coordinate"} name={'x'} value={x} options={getFields(fields.numeric)} onChange={(e, { name, value }) => dispatch(inputChanged(token, tab, name, value))}/>
                <DropDownComponent label={"Y coordinate"} name={'y'} value={y} options={getFields(fields.numeric)} onChange={(e, { name, value }) => dispatch(inputChanged(token, tab, name, value))}/>

                <Divider horizontal>Color and split</Divider>
                <Form.Field>
                    <label>Choose pathway</label>
                    <Search
                        fluid
                        name='pathway'
                        loading={isPathwayLoading}
                        onResultSelect={(e, { result }) => {dispatch(fetchPathwayData(token, tab, result.title))}}
                        onSearchChange={(e, { value }) => {dispatch(pathwaySearchResults(token, tab, value))}}
                        results={pathwayResults}
                        value={pathwayValue}
                    />

                    <label>or enter a gene set</label>
                    <TextArea
                        fluid
                        name='bulkGenes'
                        value={bulkGenes}
                        onChange={(e, { name, value }) => dispatch(bulkChanged(token, tab, value))}
                    />
                    <br/><br/>
                    <Button onClick={(e) => {dispatch(fetchBulkData(token, tab, bulkGenes))}} primary>Submit!</Button>



                </Form.Field>

                <DropDownComponent label={"Split by"} name={'split'} value={split} options={getFieldsAndNull(fields.factor)}
                                   onChange={(e, { name, value }) => dispatch(inputChanged(token, tab, name, value))} />

                <Divider horizontal>Available annotations</Divider>
                <AnnotationsComponent token={token} tab={tab} />

                <Divider horizontal>Other</Divider>
                <OtherOptionsComponent token={token} tab={tab} />
            </Form>

        </Grid.Column>
    );
};

const mapInputStateToProps = (state, ownProps) => {
    let dataset = state.datasetsByTokens[ownProps.token];
    let tab = dataset.tabs[ownProps.tab];
    const {isPathwayLoading, pathwayResults, pathwayValue, bulkGenes} = tab;
    const {x, y, split } = tab.plot;
    return {
        token: ownProps.token,
        tab: ownProps.tab,
        fields: dataset.fields,
        x, y, split, isPathwayLoading, pathwayResults, pathwayValue, bulkGenes
    }
};

const PathwayInputs = connect(
    mapInputStateToProps,
    null
)(_PathwayInputs);

const _DatasetPathwayComponent = ({token, tab, windowOpen, tabOpen, plotAreaId}) => {
    if (windowOpen && tabOpen) {
        return (
            <Grid>
                <PathwayInputs token={token} tab={tab} />
                <ScatterPlotPathwayComponent token={token} tab={tab} plotAreaId={plotAreaId}/>
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
)(_DatasetPathwayComponent);

