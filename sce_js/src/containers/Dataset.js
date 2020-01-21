import { connect } from 'react-redux'
import DatasetComponent from "../components/DatasetComponent";
import {loadedPathwaysData, loadedMarkersData, loadedExpData, loadedPlotData, loadedFilesData, tabChanged} from "../actions";

const mapStateToProps = (state, ownProps) => {
    let dataset = state.datasetsByTokens[ownProps.token];
    return {
        token: ownProps.token,
        ...dataset
    }
};

const mapDispatchToProps = dispatch => ({
    loadedPlotData: (token, data) => dispatch(loadedPlotData(token, data)),
    loadedMarkersData: (token, data) => dispatch(loadedMarkersData(token, data)),
    loadedExpData: (token, data) => dispatch(loadedExpData(token, data)),
    loadedPathwaysData: (token, data) => dispatch(loadedPathwaysData(token, data)),
    loadedFilesData: (token, data) => dispatch(loadedFilesData(token, data)),
    changeCurrentTab: (token, tab) => dispatch(tabChanged(token, tab))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(DatasetComponent)
