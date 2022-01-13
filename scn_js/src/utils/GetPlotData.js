import _ from "lodash";

// histograms and barplots only for now

export function getBarData(plotId) {
    let graph = document.getElementById(plotId);
    let data = graph.data;
    let annotations = graph.layout.annotations;

    let plotData = []

    if (_.isUndefined(annotations)) {
        plotData = _.zipWith(data[0].x, data[0].y, (x, y) => ({x, y}));
    } else {
        for (let i = 0; i < annotations.length; i++) {
            plotData = _.concat(
                plotData, _.zipWith(data[i].x, data[i].y, (x, y) => ({x, y, split: annotations[i].text}))
            )
        }
    }

    return plotData;
}

export function getHistData(plotId) {
    let graph = document.getElementById(plotId);
    let data = graph.calcdata;
    let annotations = graph.layout.annotations;

    let plotData = []

    if (_.isUndefined(annotations)) {
        plotData = _.map(data[0], x => ({"x_start": x.ph0, "x_end": x.p, "y": x.s}))
    } else {
        for (let i = 0; i < annotations.length; i++) {
            plotData = _.concat(
                plotData, _.map(data[i], x => ({"x_start": x.p0, "x_end": x.p1, "y": x.s, split: annotations[i].text}))
            )
        }
    }
    return plotData;
}