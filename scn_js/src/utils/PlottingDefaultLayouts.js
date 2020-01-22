import _ from 'lodash';

export const defaultScatterAxis = {
    showgrid: false,
    showticklabels: true,
    showline: true,
    zeroline: false,
    type: "linear",
    gridcolor: '#bdbdbd',
    gridwidth: 2,
    linecolor: '#636363',
    linewidth: 2
};


export const defaultLayout = {
    font: {
        family: "Arial",
        size: 16
    },
    hovermode: "closest",
    margin: {
        l: 40,
        r: 40,
        b: 40,
        t: 40,
        pad: 4
    }
};

export const defaultScatterLayout = _.defaultsDeep({
    xaxis: defaultScatterAxis,
    yaxis: defaultScatterAxis
}, defaultLayout);

export const linearAxis = {
    showgrid: false,
    showticklabels: true,
    showline: true,
    zeroline: false,
    type: "linear",
    gridcolor: '#bdbdbd',
    gridwidth: 2,
    linecolor: '#636363',
    linewidth: 2
};

export const categorialAxis = {
    showgrid: true,
    showticklabels: true,
    showline: false,
    type: "category",
    gridcolor: '#bdbdbd',
    gridwidth: 2,
    linecolor: '#636363',
    linewidth: 2
};

export const defaultLabelsGlobals = {
    showarrow: false,
    align: "center",
    xanchor: "left",
    yanchor: "bottom",
    bgcolor: "#FFFFFF",
    bordercolor: "#000000",
    xref: "paper",
    yref: "paper"
}