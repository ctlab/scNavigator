import React from 'react';
import {Grid, Form, Divider, Search, TextArea, Button, Label, Modal, Segment, Container} from 'semantic-ui-react';
import {getFields, getFieldsAndNull} from "../utils/Utils";
import {DropDownComponent} from "./InputComponents";
import {fetchPathwayData, pathwaySearchResults, fetchBulkData, inputChanged, bulkChanged} from "../actions";
import AnnotationsComponent from "./AnnotationsComponent";
import OtherOptionsComponent from "./OtherOptionsComponent";
import {connect} from "react-redux";
import {ScatterPlotPathwayComponent} from "./PlotComponents";
import _ from "lodash";


const _PathwayInputs = ({token, tab, x, y, split, fields, isPathwayLoading, pathwayResults,
                            pathwayValue, bulkGenes, genesInRequest, genesExpressed, dispatch}) => {
    return (
        <Grid.Column width={3}>
            <Form>
                <Divider horizontal>Coordinates</Divider>
                <DropDownComponent label={"X coordinate"} name={'x'} value={x} options={getFields(fields.numeric)} onChange={(e, { name, value }) => dispatch(inputChanged(token, tab, name, value))}/>
                <DropDownComponent label={"Y coordinate"} name={'y'} value={y} options={getFields(fields.numeric)} onChange={(e, { name, value }) => dispatch(inputChanged(token, tab, name, value))}/>

                <Divider horizontal>Pathway or Gene Set</Divider>
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

                    <Modal
                        trigger={<Button color={genesInRequest.length === 0 ? "grey" : (genesExpressed.length === 0 ? "red" : "teal")}>
                            {genesExpressed.length.toString() + "/" + genesInRequest.length.toString()}
                        </Button>}
                        header='Gene Set Expression Results'
                        content={<Modal.Content>
                            <p>These are the genes that were parsed based on your request:</p>
                            <Segment><p>{genesInRequest.join(", ")}</p></Segment>
                            <p>These are the genes that were found in the dataset based on your request:</p>
                            <Segment><p>{genesExpressed.join(", ")}</p></Segment>
                            <p>These are the genes that were not found in the dataset:</p>
                            <Segment><p>{_.difference(genesInRequest, genesExpressed).join(", ")}</p></Segment>
                        </Modal.Content>
                        }
                        actions={['Done']}
                    />


                </Form.Field>

                <Divider horizontal>Split</Divider>
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
    const {isPathwayLoading, pathwayResults, pathwayValue, bulkGenes, genesInRequest, genesExpressed} = tab;
    const {x, y, split } = tab.plot;
    return {
        token: ownProps.token,
        tab: ownProps.tab,
        fields: dataset.fields,
        x, y, split, isPathwayLoading, pathwayResults, pathwayValue, bulkGenes,
        genesInRequest, genesExpressed
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
    let tab = dataset.tabs[ownProps.tab];
    const {pathwayInvalid, pathwayInvalidMessage} = tab;
    let windowOpen = (state.datasetsTokens.indexOf(ownProps.token) + 1) === state.currentWindow;
    let tabOpen = dataset.openTabs.indexOf(ownProps.tab) === dataset.currentTab;
    return {
        token: ownProps.token,
        windowOpen, tabOpen,
        tab: ownProps.tab,
        plotAreaId: ownProps.token.concat(ownProps.tab),
        pathwayInvalid, pathwayInvalidMessage
    }
};


export default connect(
    mapStateToProps,
    null
)(_DatasetPathwayComponent);

