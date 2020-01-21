import { connect } from 'react-redux'
import TokenComponent from '../components/TokenComponent'
import {fetchToken} from "../actions";

const mapStateToProps = state => ({
    value: state.token.value,
    isErrorInput: state.token.isErrorInput,
    errorText: state.token.errorText,
    loading: state.tokenLoading
});

const mapDispatchToProps = dispatch => ({
    fetchToken: (token) => dispatch(fetchToken(token))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(TokenComponent)