import { connect } from 'react-redux'
import SingleGeneComponent from '../components/SingleGeneComponent'
import {singleGeneInputChanged, fetchSingleGeneCounts, showSingleGene} from "../actions"

const mapStateToProps = state => {
    return {
        ...state.singleGeneSearch
    }
};

const mapDispatchToProps = dispatch => ({
    changeInput: (name, value) => dispatch(singleGeneInputChanged(name, value)),
    submitSingleGeneForm: (gene, searchBy) => dispatch(fetchSingleGeneCounts(gene, searchBy)),
    showGeneExpression: (token, gene) => dispatch(showSingleGene(token, gene))

});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SingleGeneComponent);
