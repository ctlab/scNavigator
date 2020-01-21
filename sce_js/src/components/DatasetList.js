import React, {Component} from 'react';
import {Icon} from "semantic-ui-react"
import ReactTable from "react-table";
import _ from 'lodash';
import {caseInsensetiveRegexpFiltering} from "../utils/Utils";

let speciesMapping = {
    "hs": "Homo Sapiens",
    "mm": "Mus Musculus",
    "rt": "Rattus Norvegicus"
};


class DatasetList extends Component {


    render() {
        const columns = [
            {
                Header: "Name",
                accessor: 'name',
                Cell: props => <a onClick={() => this.props.fetchDataset(props.original.token)}> {props.value} </a>,
                style: {cursor: "pointer"},
                width: 200,
                filterMethod: caseInsensetiveRegexpFiltering
            }
            ,
            {
                Header: "Description",
                accessor: 'description',
                filterMethod: caseInsensetiveRegexpFiltering
            }
            ,
            {
                Header: "Organism",
                accessor: "organism",
                Cell: props => _.get(speciesMapping, props.value, null),
                filterMethod: caseInsensetiveRegexpFiltering,
                width: 150
            }
            ,
            {
                Header: "# of cells",
                accessor: "cells",
                width: 150
            }
            ,
            {
                Header: "External link",
                accessor: "link",
                Cell: props =>  {
                    return !_.isUndefined(props.value) ?
                        <a href={props.value} target={"_blank"}> <Icon name={"linkify"} size={"tiny"}/> </a> : <> </>;

                },
                width: 50
            }
        ];

        return (
            <ReactTable
                loading={this.props.publicDatasetsLoading}
                filterable
                data={this.props.publicDatasets}
                defaultPageSize={10}
                columns={columns}
            />
        );
    }
}

export default DatasetList;