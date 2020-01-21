import React, {Component} from 'react';
import queryString from "query-string";
import {Form, Message, Ref} from 'semantic-ui-react';
import _ from "lodash";


class TokenComponent extends Component {


    input = null;

    componentDidMount() {
        let query = queryString.parse(window.location.search);
        if (_.has(query,"token")) {
            this.props.fetchToken(query["token"]);
        }
    };


    render() {


        return (<Form onSubmit={e => {
            e.preventDefault();
            console.log(this.input);
            if (!this.input.value.trim()) {
                return
            }
            this.props.fetchToken(this.input.value);
        }} error={this.props.isErrorInput}>
            <Ref innerRef={node => {this.input = node.firstChild.firstChild}}>
                <Form.Input
                    error={this.props.isErrorInput}
                    placeholder='Secret token'
                    name='value'/>
            </Ref>

            <Message
                error
                header={"Error"}
                content={this.props.errorText}
            />
            <Form.Button content='Go!' />
        </Form>)
    }

}

export default TokenComponent;