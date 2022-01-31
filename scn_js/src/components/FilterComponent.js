import {
    Checkbox,
    Divider,
    Form,
    Grid
} from 'semantic-ui-react'
import {connect} from "react-redux";
import React from "react";
import _ from "lodash";
import Slider from 'rc-slider';
import Tooltip from 'rc-tooltip';
import {filterChangedFactor, filterChangedNumeric, filterChangedCellsShown} from '../actions';

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

class CellsShownSlider extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            cells: props.cells,
            cellsShown: props.cellsShown,
            onAfterChange: props.onAfterChange
        };
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.cellsShown !== this.props.cellsShown) {
            this.setState({
                cellsShown: this.props.cellsShown
            })
        }
    }

    onSliderChange = (value) => {
        this.setState({
            cellsShown: value,
        });
    }
    render() {
        return (
            <Slider
                min={1}
                max={this.state.cells}
                step={1}
                value={this.state.cellsShown}
                onChange={this.onSliderChange}
                onAfterChange={this.state.onAfterChange}
                handle={handle}
            />
        );
    }
}

const FilterComponent = ({token, fields, fieldsFull, filterLoaded, cellsShown, cells,
                             changeFilterFactor, changeFilterNumeric, changeCellsShown}) => (
    <div>
        <h4>Below you can choose which part of the dataset you want to see in the Navigator</h4>
            <Form loading={!filterLoaded}>

                <Divider horizontal>Subsampling</Divider>
                <br/>
                <Grid>
                    <Form.Field width={3}>
                        <label>{"Cells Shown"}</label>
                        <CellsShownSlider cells={cells} cellsShown={cellsShown}
                                          onAfterChange={(value) => changeCellsShown(token, value)} />
                    </Form.Field>
                </Grid>

                <Divider horizontal>Factor Fields</Divider>
                {fieldsFull.factor.map((key, index) => {
                    return  <>
                        <h5>{key}</h5><br/>
                        <Grid>
                            {fieldsFull.factorLevels[key].map((value) => {
                                return <Form.Field width={3}
                                                   control={Checkbox}
                                                   label={value}
                                                   checked={_.includes(fields.factorLevels[key], value)}
                                                   onChange={(e, val) => changeFilterFactor(token, key, value, val.checked)}
                                />
                            })}
                        </Grid>
                    </>

                })}

                <Divider horizontal>Numeric Fields</Divider>
                <br/>
                <Grid>
                    {fieldsFull.numeric.map((key, index) => {
                        return <Form.Field width={3}>
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
                </Grid>
            </Form>
    </div>
);


const mapStateToProps = (state, ownProps) => {
    let token = ownProps.token;
    let {fields, fieldsFull, filterLoaded, cellsShown, cells} = state.datasetsByTokens[ownProps.token];
    return {token, fields, fieldsFull, filterLoaded, cellsShown, cells}
};

const mapDispatchToProps = dispatch => ({
    changeFilterFactor: (token, key, value, checked) => dispatch(filterChangedFactor(token, key, value, checked)),
    changeFilterNumeric: (token, name, values) => dispatch(filterChangedNumeric(token, name, values)),
    changeCellsShown: (token, value) => dispatch(filterChangedCellsShown(token, value))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(FilterComponent)