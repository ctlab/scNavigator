import React, {Component} from 'react';
import {Form, Radio, Input, Button, Icon} from "semantic-ui-react"
import _ from 'lodash';
import {caseInsensetiveRegexpFiltering} from "../utils/Utils";
import {FilterLabel} from "../utils/Utils"
import ReactTable from "react-table";


export default class SingleGeneComponent extends Component {

    render() {

        const singleGeneTableColumns = [
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
                Header: "Title",
                accessor: 'name',
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

        let resultsBlock = <div>No results</div>
        if (!_.isEmpty(this.props.searchResults)) {
             resultsBlock = <ReactTable
                filterable
                data={this.props.searchResults}
                defaultPageSize={10}
                columns={singleGeneTableColumns}
            />
        }


        return(
            <>
                <Form loading={this.props.searchLoading}
                      onSubmit={() => this.props.submitSingleGeneForm(this.props.searchField)}>
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
                    <Button type='submit'>Submit</Button>
                    <br />< br />
                </Form>
                {resultsBlock}
            </>
        )
    }
}

