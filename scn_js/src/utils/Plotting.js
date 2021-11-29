import Plotly from "plotly.js-dist";
import {uniqueValues, which, expandRange, webglSupport} from "./Utils";
import {interpolateRainbow} from "d3-scale-chromatic/dist/d3-scale-chromatic";
import _ from 'lodash';
import {defaultScatterLayout, defaultLayout,
    linearAxis, categorialAxis,
    defaultLabelsGlobals} from "./PlottingDefaultLayouts";

let annotators = {
    text: textAnnotation,
    polygon: polygonAnnotation,
    arrows: arrowAnnotation
};

let generateAnnotations = function() {
    return {
        traces: [],
        annotations: [],
        shapes: []
    };
};

export function scatterPlot(data, fields, x, y, colorField, splitField, plotAreaId, layout, options) {
    let datas = [data];
    let traces = [{
        mode: "markers",
        type: webglSupport() ? "scattergl" : "scatter",
        showlegend: false,
        marker: {
            size: _.get(options, "plotPointSize", 8),
            color: "darkgrey"
        }
    }];

    if (_.has(options, "colorscale")) traces[0].marker.colorscale = options.colorscale;


    let axisXLayout = _.defaults({
        showgrid: _.get(options, "showPlotGrid", linearAxis.showgrid),
        range: expandRange(fields.numericRanges[x])
    }, linearAxis);

    let axisYLayout = _.defaults({
        showgrid: _.get(options, "showPlotGrid", linearAxis.showgrid),
        range: expandRange(fields.numericRanges[y])
    }, linearAxis);

    let anns = generateAnnotations();

    for (let i = 0; i < options.annotations.length; i++) {
        let annotation = options.annotations[i];
        anns = annotators[annotation.type](anns, x, y, annotation);
    }

    [datas, traces, layout, anns] = splitData(datas, traces, layout, anns, fields, splitField, axisXLayout, axisYLayout);
    [datas, traces, layout] = colorData(datas, traces, layout, fields, colorField);

    for (let i = 0; i < datas.length; i++) {
        traces[i].x = datas[i].map(a => a[x]);
        traces[i].y = datas[i].map(a => a[y]);
        traces[i].text = datas[i].map(a => {
            return(_.keys(a).map(key => key + ": " + a[key]).join('<br>'));
        });
    }

    traces = _.concat(traces, anns.traces);
    layout.annotations = _.concat(_.get(layout, "annotations", []), anns.annotations);
    layout.shapes = _.concat(_.get(layout, "shapes", []), anns.shapes);
    if (colorField !== null) {
        layout.title = colorField
    }

    Plotly.newPlot(plotAreaId, traces, _.defaultsDeep(layout, defaultScatterLayout));
}

export function histPlot(data, fields, x, splitField, percent, plotAreaId, layout, options) {
    let datas = [data];

    let mainTrace = {
        type: "histogram",
        showlegend: false,
        marker: {
            size:8,
            color: "darkgrey"
        }
    }

    if (percent === true) {
        mainTrace["histnorm"] = "probability";
    }

    let traces = [];
    traces.push(mainTrace);

    let axisXLayout = _.defaults({
        showgrid: _.get(options, "showPlotGrid", linearAxis.showgrid),
        range: expandRange(fields.numericRanges[x])
    }, linearAxis);

    let anns = generateAnnotations();
    [datas, traces, layout, anns] = splitData(datas, traces, layout, anns, fields, splitField, axisXLayout, linearAxis);

    for (let i = 0; i < datas.length; i++) {
        traces[i].x = datas[i].map(a => a[x]);
    }

    Plotly.newPlot(plotAreaId, traces, _.defaultsDeep(layout, defaultLayout));
}

export function barPlot(data, fields, x, splitField, percent, plotAreaId, layout, options) {
    let datas = [data];
    let traces = [];
    traces.push({
        type: "bar",
        showlegend: false,
        marker: {
            size:8,
            color: "darkgrey"
        }
    });

    let anns = generateAnnotations();
    [datas, traces, layout, anns] = splitData(datas, traces, layout, anns, fields, splitField, categorialAxis, linearAxis);


    let allLevels = fields.factorLevels[x];

    for (let i = 0; i < datas.length; i++) {
        let counts = _.countBy(datas[i].map(a => a[x]));
        let values = _.flatMap(allLevels, a => _.get(counts, a, 0));
        traces[i].x = allLevels;

        if (percent === true) {
            let totalSum = _.sum(values);
            traces[i].y = _.map(values, value => value / totalSum)
        } else {
            traces[i].y = values;
        }

    }

    Plotly.newPlot(plotAreaId, traces, _.defaultsDeep(layout, defaultLayout));
}

export function violinPlot(data, fields, x, y, splitField, plotAreaId, layout, options) {
    let datas = [data];
    let traces = [];

    traces.push({
        type: "violin",
        points: false,
        spanmode: "hard",
        // bandwidth: 0.1,
        // jitter: 0.4,
        // pointpos: 0.5,
        // side: "negative",
        meanline: {
            visible: true
        },
        marker: {
            size: _.get(options, "plotPointSize", 3)
        },
        line: {
            color: 'black'
        }
    });

    let axisXLayout = _.defaults({
        showgrid: _.get(options, "showPlotGrid", categorialAxis.showgrid)
    }, categorialAxis);


    let anns = generateAnnotations();

    [datas, traces, layout] = splitData(datas, traces, layout, anns, fields, splitField, axisXLayout, linearAxis);
    [datas, traces, layout] = colorData(datas, traces, layout, fields, x, "fillcolor");

    for (let i = 0; i < datas.length; i++) {
        traces[i].x = datas[i].map(a => a[x]);
        traces[i].y = datas[i].map(a => a[y]);
    }

    layout = _.defaultsDeep(layout, {
        violingap: 0
    });

    Plotly.newPlot(plotAreaId, traces, _.defaultsDeep(layout, defaultLayout));
}


export function barHistPlot(data, fields, x, splitField, percent, plotAreaId, layout, options) {
    if (fields.numeric.indexOf(x) !== -1) {
        return histPlot(data, fields, x, splitField, percent, plotAreaId, layout, options)
    } else {
        return barPlot(data, fields, x, splitField, percent, plotAreaId, layout, options)
    }


}


function constructPathString(path) {
    let n = path.length;
    let str = `M ${path[0][0]} ${path[0][1]} `;
    let end = `Z`;
    for (let i = 1; i < n; i++ ) {
        str = str + `L ${path[i][0]} ${path[i][1]} `;
    }
    str = str + end;
    return str;
}

function constructArrowsString(path) {
    let n = path.length;
    let str = '';
    for (let i = 0; i < n; i++) {
        let relx = path[i][0] - path[i][2];
        let rely = path[i][1] - path[i][3];

        let arrowLength = Math.sqrt(relx * relx + rely * rely);
        let arrowTails = Math.max(arrowLength * 0.3, 0.1);

        let a = Math.atan2(rely, relx);
        let a1 = a - Math.PI / 10;
        let a2 = a + Math.PI / 10;

        let rela1 = [arrowTails * Math.cos(a1) + path[i][2], arrowTails * Math.sin(a1) + path[i][3]];
        let rela2 = [arrowTails * Math.cos(a2) + path[i][2], arrowTails * Math.sin(a2) + path[i][3]];

        str = str + `M ${path[i][0]} ${path[i][1]} L ${path[i][2]} ${path[i][3]} L ${rela1[0]} ${rela1[1]} M ${path[i][2]} ${path[i][3]} L ${rela2[0]} ${rela2[1]} `;
    }
    return str;
}


function polygonAnnotation(anns, x, y, annotation, options) {
    let shapes = _.get(anns, "shapes", []);
    let newShapes = [];

    let groups = _.groupBy(annotation.data, a => a[annotation.value]);
    let groupsKeys = _.keys(groups);

    for (let i = 0; i < groupsKeys.length; i++) {
        let group = groups[groupsKeys[i]];
        let xs = group.map(a => a[x]);
        let ys = group.map(a => a[y]);
        let path = _.zip(xs, ys);

        newShapes.push({
            type: 'path',
            path: constructPathString(path)
        })


    }
    shapes = _.concat(shapes, newShapes);
    anns.shapes = shapes;
    return anns;
}

function arrowAnnotation(anns, x, y, annotation, options) {
    let shapes = _.get(anns, "shapes", []);
    let newShapes = [];

    let xs = annotation.data_start.map(z => z[x]);
    let ys = annotation.data_start.map(z => z[y]);
    let axs = annotation.data_end.map(z => z[x]);
    let ays = annotation.data_end.map(z => z[y]);
    let path = _.zip(xs, ys, axs, ays);

    newShapes.push({
        type: 'path',
        path: constructArrowsString(path)
    });

    shapes = _.concat(shapes, newShapes);
    anns.shapes = shapes;
    return anns;
}

function textAnnotation(anns, x, y, annotation, options) {
    let annotations = _.get(anns, "annotations", []);
    let newAnnotations = [];
    let xs = annotation.data.map(z => z[x]);
    let ys = annotation.data.map(z => z[y]);
    let vals = annotation.data.map(z => z[annotation.value]);
    let n = xs.length;
    for (let i = 0; i < n; i++) {
        newAnnotations.push({
            text: "<b>" + vals[i] + "</b>",
            x: xs[i],
            y: ys[i],
            showarrow: false,
            align: "center"
        })
    }

    annotations = _.concat(annotations, newAnnotations);
    anns.annotations = annotations;
    return anns;
}

function colorData(datas, traces, layout, fields, colorField, colorProp="marker.color") {
    if (colorField !== null) {

        if (fields.factor.indexOf(colorField) !== -1) {

            let uniqueVals = fields.factorLevels[colorField];
            let colorN = uniqueVals.length;
            let colorSet = _.range(colorN).map(a => interpolateRainbow((a) / (colorN)));

            let datasNew = [];
            let tracesNew = [];
            let colorCovered = new Array(colorN);
            colorCovered.fill(false);

            for (let i = 0; i < datas.length; i++) {
                let data = datas[i];
                let trace = traces[i];
                let colorVals = data.map(a => a[colorField]);
                let dataChunks = uniqueVals.map(val => which(colorVals, a => a === val));
                let traceChunks = new Array(uniqueVals.length);
                for (let j = 0; j < uniqueVals.length; j++) {
                    dataChunks[j] = dataChunks[j].map(a => data[a]);
                    traceChunks[j] = _.defaultsDeep({}, trace);
                    _.set(traceChunks[j], colorProp, colorSet[j]);
                    traceChunks[j].name = uniqueVals[j];
                    if (!colorCovered[j] && dataChunks[j].length > 0) {
                        traceChunks[j].showlegend = true;
                        colorCovered[j] = true;
                    }
                }

                datasNew = _.concat(datasNew, dataChunks);
                tracesNew = _.concat(tracesNew, traceChunks);

            }

            datas = datasNew;
            traces = tracesNew;


        }

        if (fields.numeric.indexOf(colorField) !== -1) {
            let cmin = fields.numericRanges[colorField][0];
            let cmax = fields.numericRanges[colorField][1];

            for (let i = 0; i < datas.length; i++) {
                traces[i].marker.color = datas[i].map(a => a[colorField]);
                traces[i].marker.cmin = cmin;
                traces[i].marker.cmax = cmax;
                traces[i].marker.colorbar = {"title": ""}
            }

        }
    }
    return [datas, traces, layout];
}

function splitData(datas, traces, layout, anns, fields, splitField, axisXLayout, axisYLayout) {
    if (splitField === null) {
        for (let i = 0; i < traces.length; i++) {
            traces[i].xaxis = "x";
            traces[i].yaxis = "y";
        }
    } else {
        let uniqueVals = fields.factorLevels[splitField];

        // Data check to only include factors that are present
        let actualSplitVals = _.flatMap(datas, (data) => data.map(a => a[splitField]));
        actualSplitVals = _.uniq(actualSplitVals);
        uniqueVals = _.filter(uniqueVals, (a) => _.includes(actualSplitVals, a));


        let splits = uniqueVals.length;

        let columns = Math.ceil(Math.sqrt(splits));
        let rows = columns;

        let xGap = 0.1;
        let yGap = 0.2;
        let columnSize = 1 / (columns + (columns - 1) * xGap);
        let rowSize = 1 / (rows + (rows - 1) * yGap);
        let xgap = xGap * columnSize;
        let ygap = yGap * rowSize;

        let xaxis = _.range(splits).map(a => "x" + (a + 1));
        let yaxis = _.range(splits).map(a => "y" + (a + 1));

        let xaxisNames = uniqueValues([...Array(splits).keys()].map(a => "xaxis" + (a + 1)));
        let yaxisNames = uniqueValues([...Array(splits).keys()].map(a => "yaxis" + (a + 1)));

        let xlabel = [...Array(splits).keys()].map(a => (a % columns) * (columnSize + xgap));
        let ylabel = [...Array(splits).keys()].map(a =>
            (rows - Math.floor(a / columns)) * (rowSize) +
            (rows - Math.floor(a / columns) - 1) * (ygap) - ygap / 2);


        let datasNew = [];
        let tracesNew = [];

        for (let i = 0; i < datas.length; i++) {
            let data = datas[i];
            let trace = traces[i];
            let splitVals = data.map(a => a[splitField]);
            let dataChunks = uniqueVals.map(val => which(splitVals, a => a === val));
            let traceChunks = new Array(uniqueVals.length);
            for (let j = 0; j < uniqueVals.length; j++) {
                dataChunks[j] = dataChunks[j].map(a => data[a]);
                traceChunks[j] = _.defaultsDeep({}, trace);
                traceChunks[j].xaxis = xaxis[j];
                traceChunks[j].yaxis = yaxis[j];
            }

            datasNew = _.concat(datasNew, dataChunks);
            tracesNew = _.concat(tracesNew, traceChunks);

        }

        let newAnnTraces = [];
        let newAnnShapes = [];
        let newAnnAnnotations = [];

        for (let j = 0; j < uniqueVals.length; j++) {

            let traceChunks = new Array(anns.traces.length);
            let shapeChunks = new Array(anns.shapes.length);
            let annChunks = new Array(anns.annotations.length);

            for (let i = 0; i < anns.traces.length; i++) {
                traceChunks[i] = _.defaultsDeep({}, anns.traces[i]);
                traceChunks[i].xaxis = xaxis[j];
                traceChunks[i].yaxis = yaxis[j];
            }

            for (let i = 0; i < anns.shapes.length; i++) {
                shapeChunks[i] = _.defaultsDeep({}, anns.shapes[i]);
                shapeChunks[i].xref = xaxis[j];
                shapeChunks[i].yref = yaxis[j];
            }

            for (let i = 0; i < anns.annotations.length; i++) {
                annChunks[i] = _.defaultsDeep({}, anns.annotations[i]);
                annChunks[i].xref = xaxis[j];
                annChunks[i].yref = yaxis[j];
            }
            newAnnTraces = _.concat(newAnnTraces, traceChunks);
            newAnnShapes = _.concat(newAnnShapes, shapeChunks);
            newAnnAnnotations = _.concat(newAnnAnnotations, annChunks);
        }

        anns = {
            traces: newAnnTraces,
            annotations: newAnnAnnotations,
            shapes: newAnnShapes
        };


        datas = datasNew;
        traces = tracesNew;


        let annotations = uniqueVals.map(val => {
            return _.defaults({
                text: val,
                x: xlabel[uniqueVals.indexOf(val)],
                y: ylabel[uniqueVals.indexOf(val)],
            }, defaultLabelsGlobals);
        });

        layout = Object.assign(layout, {
            grid: {
                rows: rows,
                columns: columns,
                xgap: xGap,
                ygap: yGap,
                pattern: "independent",
            },
            annotations: annotations
        });


        for (let i = 0; i < xaxisNames.length; i++) {
            let name = xaxisNames[i];
            layout[name] = axisXLayout;
        }

        for (let i = 0; i < yaxisNames.length; i++) {
            let name = yaxisNames[i];
            layout[name] = axisYLayout;
        }

    }
    layout = _.defaultsDeep({}, layout);
    layout['xaxis'] = axisXLayout;
    layout['yaxis'] = axisYLayout;
    return [datas, traces, layout, anns];
}