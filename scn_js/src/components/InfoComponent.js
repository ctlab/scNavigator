import React from 'react';
import {Table} from "semantic-ui-react";
import {connect} from "react-redux";
import {speciesMapping} from "../utils/Constants";

const InfoComponent = ({token, name, description, link, species, cells, isPublic, curated, debug}) => (
    <Table celled padded>
        <Table.Body>
            <Table.Row>
                <Table.HeaderCell>Token</Table.HeaderCell>
                <Table.Cell>{token}</Table.Cell>
            </Table.Row>
            <Table.Row>
                <Table.HeaderCell>Name</Table.HeaderCell>
                <Table.Cell>{name}</Table.Cell>
            </Table.Row>
            <Table.Row>
                <Table.HeaderCell>Description</Table.HeaderCell>
                <Table.Cell>{description}</Table.Cell>
            </Table.Row>
            <Table.Row>
                <Table.HeaderCell>Link</Table.HeaderCell>
                <Table.Cell>{link}</Table.Cell>
            </Table.Row>
            <Table.Row>
                <Table.HeaderCell>Species</Table.HeaderCell>
                <Table.Cell>{speciesMapping[species]}</Table.Cell>
            </Table.Row>
            <Table.Row>
                <Table.HeaderCell>Number of cells</Table.HeaderCell>
                <Table.Cell>{cells}</Table.Cell>
            </Table.Row>
            <Table.Row>
                <Table.HeaderCell>Is dataset public?</Table.HeaderCell>
                <Table.Cell>{isPublic.toString()}</Table.Cell>
            </Table.Row>
            <Table.Row>
                <Table.HeaderCell>Is dataset curated?</Table.HeaderCell>
                <Table.Cell>{curated.toString()}</Table.Cell>
            </Table.Row>
            <Table.Row>
                <Table.HeaderCell>Is dataset in debug mode?</Table.HeaderCell>
                <Table.Cell>{debug.toString()}</Table.Cell>
            </Table.Row>
        </Table.Body>
    </Table>
);


const mapStateToProps = (state, ownProps) => {
    let dataset = state.datasetsByTokens[ownProps.token];
    let {token, name, description, link, species, cells, curated, debug} = dataset;
    let isPublic = dataset.public;
    return {token, name, description, link, species, cells, isPublic, curated, debug}
};

const mapDispatchToProps = dispatch => ({});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(InfoComponent)