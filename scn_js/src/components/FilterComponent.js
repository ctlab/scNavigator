import {
    Checkbox,
    Form
} from 'semantic-ui-react'
import {connect} from "react-redux";
import React from "react";
import _ from "lodash";
import Slider from 'rc-slider';
import Tooltip from 'rc-tooltip';
import {filterChangedFactor, filterChangedNumeric} from '../actions';

const createSliderWithTooltip = Slider.createSliderWithTooltip;
const Range = createSliderWithTooltip(Slider.Range);
const Handle = Slider.Handle;


const handle = (props) => {
    const { value, dragging, index, ...restProps } = props;
    return (
        <Tooltip
            prefixCls="rc-slider-tooltip"
            overlay={value}
            visible={dragging}
            placement="top"
            key={index}
        >
            <Handle value={value} {...restProps} />
        </Tooltip>
    );
};

const FilterComponent = ({token, fields, fieldsFull, filterLoaded, changeFilterFactor, changeFilterNumeric}) => (
    <div>
        <h4>Below you can choose which part of the dataset you want to see in the Navigator</h4>
        <Form loading={!filterLoaded}>
        {fieldsFull.factor.map((key, index) => {
            return  <Form.Group grouped>
                <label>{key}</label>
                {fieldsFull.factorLevels[key].map((value) => {
                  return <Form.Field
                    control={Checkbox}
                    label={value}
                    checked={_.includes(fields.factorLevels[key], value)}
                    onChange={(e, val) => changeFilterFactor(token, key, value, val.checked)}
                    />
                })}
            </Form.Group>
        })}

        {fieldsFull.numeric.map((key, index) => {
                return <Form.Field>
                    <label>{key}</label>
                    <Range
                        defaultValue={fields.numericRanges[key]}
                        min={fieldsFull.numericRanges[key][0]}
                        max={fieldsFull.numericRanges[key][1]}
                        step={0.01}
                        onAfterChange={(values) => changeFilterNumeric(token, key, values)}
                        handle={handle}
                    />
                </Form.Field>
        })}

    </Form></div>
);


const mapStateToProps = (state, ownProps) => {
    let token = ownProps.token;
    let {fields, fieldsFull, filterLoaded} = state.datasetsByTokens[ownProps.token];
    return {token, fields, fieldsFull, filterLoaded}
};

const mapDispatchToProps = dispatch => ({
    changeFilterFactor: (token, key, value, checked) => dispatch(filterChangedFactor(token, key, value, checked)),
    changeFilterNumeric: (token, name, values) => dispatch(filterChangedNumeric(token, name, values))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(FilterComponent)