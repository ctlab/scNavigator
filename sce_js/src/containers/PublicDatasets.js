import { connect } from 'react-redux'
import DatasetList from '../components/DatasetList'
import _ from 'lodash'
import {fetchPublicDatasets, fetchDataset} from "../actions"

const mapStateToProps = state => ({
    publicDatasets: state.publicDatasets,
    publicDatasetsLoading: state.publicDatasetsLoading
});

const mapStateToPropsCurated = state => ({
    publicDatasets: _.filter(state.publicDatasets, dataset => dataset.curated),
    publicDatasetsLoading: state.publicDatasetsLoading
});

const mapDispatchToProps = dispatch => ({
    fetchPublicDatasets: () => dispatch(fetchPublicDatasets()),
    fetchDataset: (token) => dispatch(fetchDataset(token))

});



const CuratedDatasets = connect(
    mapStateToPropsCurated,
    mapDispatchToProps
)(DatasetList);

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(DatasetList)

export {CuratedDatasets};