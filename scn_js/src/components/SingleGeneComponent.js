import React, {Component} from 'react';
import {Form, Radio, Input, Button, Icon} from "semantic-ui-react"
import _ from 'lodash';
import {caseInsensetiveRegexpFiltering} from "../utils/Utils";
import {FilterLabel} from "../utils/Utils"
import ReactTable from "react-table";
import {speciesMapping} from "../utils/Constants";


export default class SingleGeneComponent extends Component {

    render() {

        const singleGeneTableColumnsDataset = [
            {
                Header: "Name",
                accessor: 'token',
                Filter: FilterLabel("~"),
                filterMethod: caseInsensetiveRegexpFiltering,
                width: 180
            }, {
                Header: "Show Gene Expression",
                accessor: 'token',
                Cell: props =>  {
                    return <button onClick={() => {
                        this.props.showGeneExpression(props.value, this.props.latestQuery.gene)}
                    } style={{cursor:'pointer'}}>Show Gene Expression</button>;

                },
                width: 150
            }, {
                Header: "External link",
                accessor: "link",
                Cell: props =>  {
                    return !_.isUndefined(props.value) ?
                        <a href={props.value} target={"_blank"} rel={"noreferrer"}>
                            <Icon name={"linkify"} size={"tiny"}/>
                        </a> : <> </>;

                },
                width: 50
            },{
                Header: "Description",
                accessor: 'description',
                Filter: FilterLabel("~"),
                filterMethod: caseInsensetiveRegexpFiltering
            }, {
                Header: "# of cells",
                accessor: 'count',
                width: 100
            }, {
                Header: "% of dataset",
                accessor: 'percent',
                Cell: props =>  {
                    return <>
                        {(props.value * 100).toFixed(2)+"%"}
                    </>
                },
                width: 70
            }];

        const singleGeneTableColumnCluster = [
            {
                Header: "Name",
                accessor: 'token',
                Filter: FilterLabel("~"),
                filterMethod: caseInsensetiveRegexpFiltering,
                width: 180
            }, {
                Header: "Show Gene Expression",
                accessor: 'token',
                Cell: props =>  {
                    return <button onClick={() => {
                        this.props.showGeneExpression(props.value, this.props.latestQuery.gene)}
                    } style={{cursor:'pointer'}}>Show Gene Expression</button>;

                },
                width: 150
            },{
                Header: "Cluster",
                accessor: 'cluster',
                Filter: FilterLabel("="),
                filterMethod: (filter, row) => String(row[filter.id]) === filter.value
            }, {
                Header: "Adjusted p value",
                accessor: 'pvalueAdjusted'
            }, {
                Header: "% in cluster",
                accessor: 'pct1',
                Cell: props =>  {
                    return <>
                        {(props.value * 100).toFixed(2)+"%"}
                    </>
                },
            }
        ]


        let resultsBlock = <div>No results</div>
        if (!_.isEmpty(this.props.searchResults)) {

            if (this.props.latestQuery.searchBy === "dataset") {
                resultsBlock = <ReactTable
                    filterable
                    data={this.props.searchResults}
                    defaultPageSize={10}
                    columns={singleGeneTableColumnsDataset}/>
            } else if (this.props.latestQuery.searchBy === "cluster") {
                resultsBlock = <ReactTable
                    filterable
                    data={this.props.searchResults}
                    defaultPageSize={10}
                    columns={singleGeneTableColumnCluster}/>
            }
        }


        return(
            <>
                <Form loading={this.props.searchLoading}
                      onSubmit={() => this.props.submitSingleGeneForm(this.props.searchField, this.props.searchBy)}>
                    <Form.Field>
                        Type gene name in Symbol format below.
                    </Form.Field>
                    <Form.Field>
                        <Input placeholder='Paste gene here'
                               name={"searchField"}
                               value={this.props.searchField}
                               onChange={(e, { name, value }) =>
                                   this.props.changeInput("searchField", value)} />
                    </Form.Field>
                    <Form.Group>
                        <Form.Field>
                            <Radio
                                label='By cluster'
                                name='radioGroupSingleGene'
                                value='cluster'
                                checked={this.props.searchBy === 'cluster'}
                                onChange={() => this.props.changeInput("searchBy", "cluster")}
                            />
                        </Form.Field>
                        <Form.Field>
                            <Radio
                                label='By dataset'
                                name='radioGroupSingleGene'
                                value='dataset'
                                checked={this.props.searchBy === 'dataset'}
                                onChange={() => this.props.changeInput("searchBy", "dataset")}
                            />
                        </Form.Field>
                    </Form.Group>
                    <Button type='submit'>Submit</Button>
                    <br />< br />
                </Form>
                {resultsBlock}
            </>
        )
    }
}

