import { connect } from 'react-redux'
import GeneSignatureComponent from '../components/GeneSignatureComponent'
import {geneSignatureInputChanged, fetchGeneSignature, showGeneSignature} from "../actions"

const mapStateToProps = state => {
    return {
        ...state.geneSearch
    }
};


const mapDispatchToProps = dispatch => ({
    changeInput: (name, value) => dispatch(geneSignatureInputChanged(name, value)),
    submitGeneSignatureForm: (from, to, value) => dispatch(fetchGeneSignature(from, to, value)),
    showGeneSignature: (token, genes) => dispatch(showGeneSignature(token, genes))

});


export default connect(
    mapStateToProps,
    mapDispatchToProps
)(GeneSignatureComponent);
