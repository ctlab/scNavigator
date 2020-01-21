import React, { Component } from 'react';
import {Button, Form, Image } from "semantic-ui-react";
import ReactTable from "react-table";
import {parse} from "json2csv";
import fileDownload from "js-file-download";
import _ from 'lodash';
import {DropDownComponent} from "./InputComponents";
import {caseInsensetiveRegexpFiltering} from "../utils/Utils";
import {connect} from "react-redux";
import {EXPRESSION_SCATTER, EXPRESSION_VIOLIN} from "../reducers/Tabs";
import {fetchGeneData} from "../actions";
import ReactTooltip from "react-tooltip";

const FilterLabel = (label) => ({filter, onChange}) => (
    <div className="ui labeled fluid input">
        <div className="ui label">
            {label}
        </div>
        <input
            fluid
            type="text"
            onChange={event => onChange(event.target.value)}/>
    </div>);

class DatasetMarkers extends Component {

    constructor(props) {
        super(props);
        this.reactTable = React.createRef();

        this.state = {
            chosenTable: _.keys(props.markers)[0]
        }
    }

    handleClick = () => {
        let data = this.reactTable.getResolvedState().sortedData;
        let fields = ["gene", "cluster", "avg_logFC", "p_val", "p_val_adj", "pct1", "pct2"];
        let opts = { fields };
        let csv = parse(data, opts);
        fileDownload(csv, "markers.csv");

    };

    handleChange = (e, { name, value }) => this.setState({[name]: value});

    render() {

        const {chosenTable} = this.state;
        const tables = _.keys(this.props.markers).map(a => { return {text: a, value: a}});

        const columns = [
        {
            Header: "Gene name",
            accessor: 'gene',
            Cell: props =>
                <>{props.value}
                    <Image.Group className={"floated right"} size={"mini"}>
                        <a onClick={() => {this.props.fetchGeneData(this.props.token, EXPRESSION_SCATTER, props.value)}}
                           style={{cursor:'pointer'}}><Image data-tip="Show expression of this gene on scatter plot" style={{margin: 0}}  src={"build/sce-01.svg"} /></a>
                        <a onClick={() => {this.props.fetchGeneData(this.props.token, EXPRESSION_VIOLIN, props.value)}}
                           style={{cursor:'pointer'}}><Image data-tip="Show expression of this gene on violin plot" style={{margin: 0}}  src={"build/sce-02.svg"} /></a>
                    </Image.Group>
                </>,
            Filter: FilterLabel("~"),
            filterMethod: caseInsensetiveRegexpFiltering
        }, {
            Header: "Cluster",
            accessor: 'cluster',
            Filter: FilterLabel("="),
            filterMethod: (filter, row) => String(row[filter.id]) === filter.value
        }, {
            Header: "Av. log-fold change",
            accessor: 'avg_logFC',
            Filter: FilterLabel(">"),
            filterMethod: (filter, row) => row[filter.id] > parseFloat(filter.value)

        }, {
            Header: "P value",
            accessor: 'p_val',
            Filter: FilterLabel("< 1e-"),
            filterMethod: (filter, row) => row[filter.id] < Math.pow(10, -parseFloat(filter.value))
        }, {
            Header: "Adjusted p value",
            accessor: 'p_val_adj',
            Filter: FilterLabel("< 1e-"),
            filterMethod: (filter, row) => row[filter.id] < Math.pow(10, -parseFloat(filter.value))
        }, {
            Header: "% in cluster",
            id: 'pct1',
            accessor: d => d['pct.1'],
            Filter: FilterLabel(">"),
            filterMethod: (filter, row) => row[filter.id] > parseFloat(filter.value)
        }, {
            Header: "% outside",
            id: 'pct2',
            accessor: d => d['pct.2'],
            Filter: FilterLabel("<"),
            filterMethod: (filter, row) => row[filter.id] < parseFloat(filter.value)
        }];




        return(<div>
                <Form>
                    <DropDownComponent onChange={this.handleChange} options={tables} value={chosenTable} name={'chosenTable'} label={"Choose the table"}/>
                </Form>
                <br/>
                <ReactTooltip place={"top"} type={"info"} effect={"solid"} />
                    <ReactTable
                        loading={!this.props.markersLoaded}
                        filterable
                        ref={(r) => this.reactTable = r}
                        data={this.props.markers[chosenTable]}
                        defaultPageSize={10}
                        columns={columns}
                    />

                <br/>
                <Button
                    onClick={this.handleClick}
                >
                    Download current table
                </Button>
            </div>

        )
    }
}

const mapStateToProps = (state, ownProps) => {
    let dataset = state.datasetsByTokens[ownProps.token];
    let {markers, markersLoaded} = dataset;
    return {markers, markersLoaded, ...ownProps}
};

const mapDispatchToProps = dispatch => ({
    fetchGeneData: (token, tab, gene) => dispatch(fetchGeneData(token, tab, gene)),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(DatasetMarkers)