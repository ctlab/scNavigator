import {Accordion, Checkbox} from "semantic-ui-react";
import React from "react";
import {inputChanged} from "../actions";
import {connect} from "react-redux";
import {Form} from "semantic-ui-react";

const OtherOptionsComponent = ({token, plot, tab, dispatch}) => {
    let {fontSize, plotPointSize, showPlotGrid} = plot;
    let panels = [
        {
            key: "style",
            title: "Style (Font size, point size, etc)",
            content: {
                content: (<div>
                    <Checkbox name='showPlotGrid' label="Show plot grid" checked={showPlotGrid}
                              onChange={(e, { name, checked }) => dispatch(inputChanged(token, tab, name, checked))} />
                    <br/> <br/>
                    <Form.Input
                        label={`Point size: ${plotPointSize }`}
                        min={1}
                        max={16}
                        name='plotPointSize'
                        onChange={(e, { name, value }) => dispatch(inputChanged(token, tab, name, value))}
                        step={1}
                        type='range'
                        value={plotPointSize}
                    />
                    <br/>
                    <Form.Input
                        label={`Font size: ${fontSize }`}
                        min={4}
                        max={32}
                        name='fontSize'
                        onChange={(e, { name, value }) => dispatch(inputChanged(token, tab, name, value))}
                        step={1}
                        type='range'
                        value={fontSize}
                    />
                </div>)
            }
        }
    ];
    return <Accordion panels={panels}/>
};

const mapStateToProps = (state, ownProps) => {
    let dataset = state.datasetsByTokens[ownProps.token];
    let tab = dataset.tabs[ownProps.tab];
    let plot = tab.plot;
    return {
        token: ownProps.token,
        tab: ownProps.tab,
        plot
    }
};

export default connect(
    mapStateToProps,
    null
)(OtherOptionsComponent);