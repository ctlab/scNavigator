import {
    Button,
    Checkbox,
    Form,
    Input,
    Radio,
    Select,
    TextArea,
} from 'semantic-ui-react'
import {connect} from "react-redux";
import React from "react";
import _ from "lodash";
import { Slider } from "react-semantic-ui-range";

const FilterComponent = ({fields, fieldsFull}) => (
    <div>
        <h4>Below you can choose which part of the dataset you want to see in the Navigator</h4>
        <Form>
        {fieldsFull.factor.map((key, index) => {
            return  <Form.Group inline>
                <label>{key}</label>
                {fieldsFull.factorLevels[key].map((value) => {
                  return <Form.Field
                    control={Checkbox}
                    label={value}
                    value={_.includes(fields.factorLevels[key], value)}
                    />
                })}
            </Form.Group>
        })}

        {fieldsFull.numeric.map((key, index) => {
            return  <Form.Group inline>
                <label>{key}</label>
                <Slider
                    multiple
                    value={fields.numericRanges[key]}
                    color="blue"
                    settings={{
                        min: fieldsFull.numericRanges[key][0],
                        max: fieldsFull.numericRanges[key][1]
                    }}
                />
            </Form.Group>
        })}

    </Form></div>
);


const mapStateToProps = (state, ownProps) => {
    let fields = state.datasetsByTokens[ownProps.token].fields;
    let fieldsFull = state.datasetsByTokens[ownProps.token].fieldsFull;
    return {fields, fieldsFull}
};

const mapDispatchToProps = dispatch => ({});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(FilterComponent)