let _ =  require('lodash');
let d3 =  require('d3-hexbin');




function hexBinPlot(data, fields, x, y, colorField, splitField, plotAreaId, layout, options) {
    let datas = [data];
    let points = _.map(_.range(data.length), i => [data[i][x], data[i][y], i]);
    let hexbin = d3.hexbin();
    let hexes = hexbin(points);
    // console.log(data.slice(0, 5));
    console.log(hexes);
    // console.log(hexbin.centers());

    // Plotly.newPlot(plotAreaId, traces, _.defaultsDeep(layout, defaultScatterLayout));
}

let data = require("/home/askmebefore/Dropbox (ArtyomovLab)/ArtyomovLab Team Folder/sce-preloaded/HCA/pancreas/plot_data.json");
hexBinPlot(data.data, data.fields, "tSNE_1", "tSNE_2")

