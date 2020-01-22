import React, {Component} from 'react';
import {barHistPlot, scatterPlot, violinPlot} from "../utils/Plotting";
import {connect} from "react-redux";
import {Dimmer, Grid, Loader} from 'semantic-ui-react';
import _ from "lodash";
import {mean, std} from "mathjs/src/entry/pureFunctionsAny.generated";

const pathwayColorScale = [
    ['0.0', 'rgb(0,0,139)'], // dark blue
    ['0.2', 'rgb(0,255,255)'], //cyan
    ['0.4', 'rgb(255,255,0)'], // yellow
    ['0.6', 'rgb(255,0,0)'], // red
    ['0.8', 'rgb(139,0,0)'], //dark red
    ['1.0', 'rgb(139,62,47)'] //coral4
];


const getChosenAnnotations = (annotations, plot) => {
    let {x, y} = plot;
    let coords = [x, y];
    let possibleAnnotations = _.filter(_.keys(annotations),
        a => _.includes(coords, annotations[a].coords[0]) &&
            _.includes(coords, annotations[a].coords[1]));

    let chosenAnnotations = _.filter(possibleAnnotations,
        key => plot.annotations[key]);
    chosenAnnotations = chosenAnnotations.map(key => annotations[key]);
    return chosenAnnotations;
};


class PlotComponents extends Component {
    componentDidUpdate(prevProps, prevState, snapshot) {
        this.plotData();
    }

    componentDidMount() {
        this.plotData();
        window.addEventListener("resize", () => this.plotData());
    };

    render() {
        // console.log("PLOT RENDERING");
        // console.log(this.props.tab);
        return (<Grid.Column width={13} id={this.props.plotAreaId}>
            <Dimmer active={this.props.plotLoading} inverted>
                <Loader size='medium'>Loading</Loader>
            </Dimmer>
        </Grid.Column>);
    }
}

class _ScatterPlotComponentOverview extends PlotComponents {
    plotData() {
        let plotAreaId = this.props.plotAreaId;

        let height = document.documentElement.clientHeight * 0.8;
        let width = document.documentElement.clientWidth * 0.6;
        let zz = Math.min(height, width);

        const {x, y, color, split, showPlotGrid, plotPointSize, fontSize} = this.props.plot;
        let chosenAnnotations = getChosenAnnotations(this.props.annotations, this.props.plot);

        let layout = {
            show_legend: true,
            width: zz,
            height: zz,
            font: {
                size: fontSize
            }
        };

        scatterPlot(this.props.data,
            this.props.fields,
            x, y, color, split,
            plotAreaId, layout,
            {
                showPlotGrid,
                plotPointSize,
                annotations: chosenAnnotations});
    }

}





const mapOverviewStateToProps = (state, ownProps) => {
    let dataset = state.datasetsByTokens[ownProps.token];
    let tab = dataset.tabs[ownProps.tab];
    let plot = tab.plot;
    let annotations = dataset.annotations;

    return {
        data: dataset.plotData,
        fields: dataset.fields,
        plot, annotations,
        plotLoading: false,
        ...ownProps
    }
};

const ScatterPlotOverviewComponent = connect(
    mapOverviewStateToProps,
    null
)(_ScatterPlotComponentOverview);



class _ExpressionScatterPlot extends PlotComponents {
    plotData() {

        let plotAreaId = this.props.plotAreaId;

        let height = document.documentElement.clientHeight * 0.8;
        let width = document.documentElement.clientWidth * 0.6;
        let zz = Math.min(height, width);

        const {x, y, gene, geneData, split, showPlotGrid, plotPointSize, fontSize, log2, scaled, zscore} = this.props.plot;
        let plotData = _.clone(this.props.data);
        let plotFields = _.clone(this.props.fields);
        let chosenAnnotations = getChosenAnnotations(this.props.annotations, this.props.plot);

        if (geneData !== null && gene !== null) {

            let ggdata = _.cloneDeep(geneData);
            if (scaled) ggdata = _.zipWith(ggdata, this.props.expData.totalCounts, (a, b) => a * 10000 / b);
            if (log2) ggdata = ggdata.map(a => Math.log2(a + 1));

            if (zscore) {
                let ggmean = mean(ggdata);
                let ggsd = std(ggdata);
                ggdata = ggdata.map(a => (a - ggmean) / ggsd);
            }

            let geneMin = _.min(ggdata);
            let geneMax = _.max(ggdata);

            for (let i = 0; i < plotData.length; i++) {
                plotData[i][gene] = ggdata[i];
            }

            plotFields.numeric.push(gene);
            plotFields.numericRanges[gene] = [geneMin, geneMax];
        }

        let layout = {
            show_legend: true,
            width: zz,
            height: zz,
            font: {
                size: fontSize
            }
        };

        scatterPlot(plotData, plotFields,
            x, y, gene, split,
            plotAreaId, layout,
            {
                showPlotGrid,
                plotPointSize,
                annotations: chosenAnnotations});
    }

}





const mapExpressionStateToProps = (state, ownProps) => {
    let dataset = state.datasetsByTokens[ownProps.token];
    let tab = dataset.tabs[ownProps.tab];
    let plot = tab.plot;
    let {annotations, expData } = dataset ;

    return {
        data: dataset.plotData,
        fields: dataset.fields,
        plot, annotations, expData,
        plotLoading: tab.plotLoading,
        ...ownProps
    }
};

const ScatterPlotExpressionComponent = connect(
    mapExpressionStateToProps,
    null
)(_ExpressionScatterPlot);


class _HistogramPlotComponent extends PlotComponents {
    plotData() {
        let plotAreaId = this.props.plotAreaId;
        let height = document.documentElement.clientHeight * 0.8;
        let width = document.documentElement.clientWidth * 0.62;

        const {x, split, showPlotGrid, fontSize} = this.props.plot;

        let layout = {
            show_legend: true,
            width: width,
            height: height,
            font: {
                size: fontSize
            }
        };

        barHistPlot(this.props.data,
            this.props.fields,
            x, split, plotAreaId, layout, {showPlotGrid})
    }
}

const mapHistogramStateToProps = (state, ownProps) => {
    let dataset = state.datasetsByTokens[ownProps.token];
    let tab = dataset.tabs[ownProps.tab];
    let plot = tab.plot;

    return {
        data: dataset.plotData,
        fields: dataset.fields,
        plot,
        plotLoading: false,
        ...ownProps
    }
};

const HistogramPlotComponent = connect(
    mapHistogramStateToProps,
    null
)(_HistogramPlotComponent);





class _ViolinPlotComponent extends PlotComponents {
    plotData() {
        let plotAreaId = this.props.plotAreaId;

        let height = document.documentElement.clientHeight * 0.8;
        let width = document.documentElement.clientWidth * 0.62;

        const {x, gene, geneData, split, showPlotGrid, plotPointSize, fontSize, log2, scaled, zscore} = this.props.plot;
        let plotData = _.clone(this.props.data);
        let plotFields = _.clone(this.props.fields);

        if (geneData !== null && gene !== null) {

            let ggdata = _.cloneDeep(geneData);
            if (scaled) ggdata = _.zipWith(ggdata, this.props.expData.totalCounts, (a, b) => a * 10000 / b);
            if (log2) ggdata = ggdata.map(a => Math.log2(a + 1));

            if (zscore) {
                let ggmean = mean(ggdata);
                let ggsd = std(ggdata);
                ggdata = ggdata.map(a => (a - ggmean) / ggsd);
            }

            let geneMin = _.min(ggdata);
            let geneMax = _.max(ggdata);

            for (let i = 0; i < plotData.length; i++) {
                plotData[i][gene] = ggdata[i];
            }

            plotFields.numeric.push(gene);
            plotFields.numericRanges[gene] = [geneMin, geneMax];
        }

        let layout = {
            show_legend: true,
            width: width,
            height: height,
            font: {
                size: fontSize
            }
        };

        violinPlot(plotData, plotFields, x, gene, split,
            plotAreaId, layout,
            {
                showPlotGrid,
                plotPointSize});
    }
}


const ViolinPlotComponent = connect(
    mapExpressionStateToProps,
    null
)(_ViolinPlotComponent);



class _ScatterPlotPathwayComponent extends PlotComponents {
    plotData() {
        let plotAreaId = this.props.plotAreaId;

        let height = document.documentElement.clientHeight * 0.8;
        let width = document.documentElement.clientWidth * 0.6;
        let zz = Math.min(height, width);

        const {x, y, pathway, pathwayData, split, showPlotGrid, plotPointSize, fontSize} = this.props.plot;
        let plotData = _.clone(this.props.data);
        let plotFields = _.clone(this.props.fields);
        let chosenAnnotations = getChosenAnnotations(this.props.annotations, this.props.plot);


        if (pathwayData !== null && pathway !== null) {

            let geneMin = _.min(pathwayData);
            let geneMax = _.max(pathwayData);

            for (let i = 0; i < plotData.length; i++) {
                plotData[i][pathway] = pathwayData[i];
            }

            plotFields.numeric.push(pathway);
            plotFields.numericRanges[pathway] = [geneMin, geneMax];
        }



        let layout = {
            show_legend: true,
            width: zz,
            height: zz,
            font: {
                size: fontSize
            }
        };


        scatterPlot(plotData, plotFields,
            x, y, pathway, split,
            plotAreaId, layout,
            {
                showPlotGrid,
                plotPointSize,
                colorscale: pathwayColorScale,
                annotations: chosenAnnotations});
    }
}

const mapPathwayStateToProps = (state, ownProps) => {
    let dataset = state.datasetsByTokens[ownProps.token];
    let tab = dataset.tabs[ownProps.tab];
    let plot = tab.plot;

    let { annotations, expData } = dataset ;

    return {
        data: dataset.plotData,
        fields: dataset.fields,
        plot, annotations, expData,
        plotLoading: tab.plotLoading,
        ...ownProps
    }
};

const ScatterPlotPathwayComponent = connect(
    mapPathwayStateToProps,
    null
)(_ScatterPlotPathwayComponent);



export {ScatterPlotOverviewComponent, ScatterPlotExpressionComponent, HistogramPlotComponent, ViolinPlotComponent,
    ScatterPlotPathwayComponent};