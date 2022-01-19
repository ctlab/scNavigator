import React, {Component} from 'react';
import {barHistPlot, densityPlot, scatterPlot, violinPlot} from "../utils/Plotting";
import {connect} from "react-redux";
import {Dimmer, Grid, Loader, Message} from 'semantic-ui-react';
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

const customColorScale = [
    [-3, 'rgb(0,0,139)'], [-2, 'rgb(0,0,255)'],
    [-1, 'rgb(100,100,200)'], [0, 'rgb(200, 200, 200)'],
    [1, 'rgb(255,102,102)'], [2, 'rgb(255,0,0)'],
    [3, 'rgb(139,0,0)']
]


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
        if (!this.props.plotLoading && !this.props.plotError) {
            this.plotData();
        }

    }

    componentDidMount() {
        if (!this.props.plotLoading && !this.props.plotError) {
            this.plotData();
            window.addEventListener("resize", () => this.plotData());
        }
    };

    render() {
        // console.log("PLOT RENDERING");
        // console.log(this.props.tab);
        if (this.props.plotLoading) {
            return (<Grid.Column width={13} id={this.props.plotAreaId}>
                <Dimmer active inverted>
                    <Loader size='medium'>Loading</Loader>
                </Dimmer>
            </Grid.Column>)
        } else if (this.props.plotError) {
            return (<Grid.Column width={13} id={this.props.plotAreaId}>
                <Dimmer active inverted>
                    <Message negative floating>
                        <Message.Header>The genes you provided are not expressed or not present in this dataset.</Message.Header>
                    </Message>
                </Dimmer>
            </Grid.Column>)
        } else {
            return (<Grid.Column width={13} id={this.props.plotAreaId} />)
        }

    }
}

class _ScatterPlotComponentOverview extends PlotComponents {
    plotData() {
        let plotAreaId = this.props.plotAreaId;

        let height = document.documentElement.clientHeight * 0.8;
        let width = document.documentElement.clientWidth * 0.6;
        let zz = Math.min(height, width);

        const {x, y, color, split, useDensity, showPlotGrid, plotPointSize, fontSize} = this.props.plot;
        let chosenAnnotations = getChosenAnnotations(this.props.annotations, this.props.plot);

        let layout = {
            show_legend: true,
            width: zz,
            height: zz,
            font: {
                size: fontSize
            }
        };

        console.log(this.props.plot);
        if (useDensity) {
            densityPlot(this.props.data,
                this.props.fields,
                x, y, split,
                plotAreaId, layout,
                {
                    showPlotGrid,
                    plotPointSize,
                    annotations: chosenAnnotations});
        } else {
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

}





const mapOverviewStateToProps = (state, ownProps) => {
    let dataset = state.datasetsByTokens[ownProps.token];
    let tab = dataset.tabs[ownProps.tab];
    let { plotLoading, plotError, plotErrorMessage } = tab;
    let plot = tab.plot;
    let annotations = dataset.annotations;

    return {
        data: dataset.plotData,
        fields: dataset.fields,
        plot, annotations,
        plotLoading, plotError, plotErrorMessage,
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

        const {x, y, gene, split, showPlotGrid, plotPointSize, fontSize, log2, scaled, zscore} = this.props.plot;
        const geneData = this.props.cachedGenes[gene];
        let plotDataFull = this.props.plotDataFull;
        let fieldsFull = this.props.fieldsFull;
        let chosenAnnotations = getChosenAnnotations(this.props.annotations, this.props.plot);

        if (geneData !== undefined && geneData !== null && gene !== null) {

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

            for (let i = 0; i < plotDataFull.length; i++) {
                plotDataFull[i][gene] = ggdata[i];
            }

            this.props.fields.numericRanges[gene] = [geneMin, geneMax];
            fieldsFull.numericRanges[gene] = [geneMin, geneMax];
        }

        let layout = {
            show_legend: true,
            width: zz,
            height: zz,
            font: {
                size: fontSize
            }
        };

        scatterPlot(this.props.data, this.props.fields,
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
    let { plotLoading, plotError, plotErrorMessage } = tab;
    let plot = tab.plot;
    let { annotations, expData } = dataset ;
    let cachedGenes = dataset.cachedGenes;

    return {
        plotDataFull: dataset.plotDataFull,
        fieldsFull: dataset.fieldsFull,
        data: dataset.plotData,
        fields: dataset.fields,
        plot, annotations, expData, cachedGenes,
        plotLoading, plotError, plotErrorMessage,
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

        const {x, split, percent, showPlotGrid, fontSize} = this.props.plot;

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
            x, split, percent, plotAreaId, layout, {showPlotGrid})
    }
}

const mapHistogramStateToProps = (state, ownProps) => {
    let dataset = state.datasetsByTokens[ownProps.token];
    let tab = dataset.tabs[ownProps.tab];
    let { plotLoading, plotError, plotErrorMessage } = tab;
    let plot = tab.plot;

    return {
        data: dataset.plotData,
        fields: dataset.fields,
        plot,
        plotLoading, plotError, plotErrorMessage,
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

        const {x, gene, split, showPlotGrid, plotPointSize, fontSize, log2, scaled, zscore} = this.props.plot;
        const geneData = this.props.cachedGenes[gene];
        let plotDataFull = this.props.plotDataFull;
        let fieldsFull = this.props.fieldsFull;

        if (geneData !== undefined && geneData !== null && gene !== null) {

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

            for (let i = 0; i < plotDataFull.length; i++) {
                plotDataFull[i][gene] = ggdata[i];
            }

            this.props.fields.numericRanges[gene] = [geneMin, geneMax];
            fieldsFull.numericRanges[gene] = [geneMin, geneMax];
        }

        let layout = {
            show_legend: true,
            width: width,
            height: height,
            font: {
                size: fontSize
            }
        };

        violinPlot(this.props.data, this.props.fields, x, gene, split,
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

        const {x, y, pathway, split, showPlotGrid, plotPointSize, fontSize} = this.props.plot;
        const pathwayData = this.props.pathwayValues;
        let plotDataFull = this.props.plotDataFull;
        let plotFieldsFull = this.props.fieldsFull;
        let chosenAnnotations = getChosenAnnotations(this.props.annotations, this.props.plot);


        let actualColorScale = _.cloneDeep(customColorScale);
        if (pathwayData !== undefined && pathwayData !== null && pathway !== null ) {

            let geneMin = _.min(pathwayData);
            let geneMax = _.max(pathwayData);

            for (let i = 0; i < plotDataFull.length; i++) {
                plotDataFull[i][pathway] = pathwayData[i];
            }

            this.props.fields.numericRanges[pathway] = [geneMin, geneMax];
            plotFieldsFull.numericRanges[pathway] = [geneMin, geneMax];

            let lastColor = 'rgb(0,0,139)';
            while (geneMin >= actualColorScale[0][0]) {
                lastColor = actualColorScale[0][1];
                actualColorScale = _.tail(actualColorScale);

            }
            actualColorScale.unshift([geneMin, lastColor]);

            lastColor = 'rgb(139,0,0)';
            while (geneMax <= actualColorScale[actualColorScale.length - 1][0]) {
                lastColor = actualColorScale[actualColorScale.length - 1][1];
                actualColorScale = _.take(actualColorScale, actualColorScale.length - 1);
            }
            actualColorScale.push([geneMax, lastColor]);

            let toRangeValues = (value) => (value - geneMin) / (geneMax - geneMin);
            let toColorArray = (l) => [toRangeValues(l[0]), l[1]];
            actualColorScale = _.map(actualColorScale, toColorArray);

        }



        let layout = {
            show_legend: true,
            width: zz,
            height: zz,
            font: {
                size: fontSize
            }
        };

        console.log(actualColorScale);
        scatterPlot(this.props.data, this.props.fields,
            x, y, pathway, split,
            plotAreaId, layout,
            {
                showPlotGrid,
                plotPointSize,
                colorscale: actualColorScale,
                annotations: chosenAnnotations});
    }
}

const mapPathwayStateToProps = (state, ownProps) => {
    let dataset = state.datasetsByTokens[ownProps.token];
    let tab = dataset.tabs[ownProps.tab];
    let { plotLoading, plotError, plotErrorMessage } = tab;
    let plot = tab.plot;

    let { annotations, expData } = dataset ;
    let { fields, fieldsFull, plotDataFull } = dataset;

    return {
        data: dataset.plotData,
        fields, fieldsFull, plotDataFull,
        plot, annotations, expData,
        plotLoading, plotError, plotErrorMessage,
        pathwayValues: dataset.pathwayValues,
        ...ownProps
    }
};

const ScatterPlotPathwayComponent = connect(
    mapPathwayStateToProps,
    null
)(_ScatterPlotPathwayComponent);



export {ScatterPlotOverviewComponent, ScatterPlotExpressionComponent, HistogramPlotComponent, ViolinPlotComponent,
    ScatterPlotPathwayComponent};