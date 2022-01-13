import React from 'react';
import {Grid, Form, Divider, Checkbox, Button} from 'semantic-ui-react';
import { getFields, getFieldsAndNull} from "../utils/Utils";
import {DropDownComponent} from "./InputComponents";
import {inputChanged} from "../actions";
import {connect} from "react-redux";
import OtherOptionsComponent from "./OtherOptionsComponent";
import {HistogramPlotComponent} from "./PlotComponents";
import {parse} from "json2csv";
import fileDownload from "js-file-download";
import _ from "lodash";
import {getHistData, getBarData} from "../utils/GetPlotData";


const _DatasetHistogramInputs = ({token, tab, x, split, percent, fields, dispatch}) => {

    let plotArea = token.concat(tab)
    let handleDownloadClick = () => {
        let fieldsCSV = [];
        let dataCSV = [];

        if (_.includes(fields.factor, x)) {
            if (!_.isNull(split)) fieldsCSV.push({label: split, value: "split"})
            fieldsCSV.push({label: x, value: "x"});
            if (percent) {
                fieldsCSV.push({label: "Ratio", value: "y"})
            } else fieldsCSV.push({label: "Count", value: "y"});
            dataCSV = getBarData(plotArea);

        } else {
            if (!_.isNull(split)) fieldsCSV.push({label: split, value: "split"})
            fieldsCSV.push({label: x + "_start", value: "x_start"});
            fieldsCSV.push({label: x + "_end", value: "x_end"});
            if (percent) {
                fieldsCSV.push({label: "Ratio", value: "y"})
            } else fieldsCSV.push({label: "Count", value: "y"});
            dataCSV = getHistData(plotArea);
        }

        let csv = parse(dataCSV, {fields: fieldsCSV});
        let fileNameParts = _.concat(token, _.map(fieldsCSV, x => x.label));
        let fileName = fileNameParts.join("-") + '.csv';

        fileDownload(csv, fileName);
    };

    return (<Grid.Column width={3}>
        <Form>
            <Divider horizontal>Bar plot inputs</Divider>
            <DropDownComponent label={"X coordinate"} name={'x'} value={x} options={getFields(fields.all)} onChange={(e, { name, value }) => dispatch(inputChanged(token, tab, name, value))} />
            <DropDownComponent label={"Split by"} name={'split'} value={split} options={getFieldsAndNull(fields.factor)} onChange={(e, { name, value }) => dispatch(inputChanged(token, tab, name, value))} />
            <Checkbox name='percent' label="Show Percentage" checked={percent} onChange={(e, { name, checked }) => dispatch(inputChanged(token, tab, name, checked))} /><br/><br/>



            <Divider horizontal>Other</Divider>
            <OtherOptionsComponent token={token} tab={tab} />

            <Divider horizontal>Downloads</Divider>
            <Button className={"fluid"}
                onClick={handleDownloadClick}
            >
                Download current data
            </Button>
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