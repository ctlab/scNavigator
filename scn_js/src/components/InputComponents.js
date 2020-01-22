import {Dropdown, Form} from "semantic-ui-react";
import React from "react";


export const DropDownComponent = ({label, name, value, options, onChange}) => (
    <Form.Field>
        <label>{label}</label>
        <Dropdown
            selection
            fluid
            name={name}
            value={value}
            options={options}
            placeholder={label}
            onChange={onChange}
        />
    </Form.Field>
);


