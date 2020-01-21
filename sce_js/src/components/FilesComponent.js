import React from 'react';
import {List} from "semantic-ui-react";
import {format} from 'timeago.js';
import filesize from 'filesize';
import _ from 'lodash';
import {connect} from "react-redux";


const fileTypes = {
    'file excel outline': ['.xls', '.xlsx', '.xlsm','.tsv', '.csv'],
    'file pdf outline': ['.pdf'],
    'file word outline': ['.word'],
    'file archive outline': ['.Rda', '.Robj', '.rda', '.Robj'],
    'file powerpoint outline': ['.pptx', '.ppt', '.pptm'],
    'file code outline': ['.R', '.cpp', '.java'],
    'file image outline': ['.png', '.jpg', '.svg']
};

let fileTypeMapper = (filename) => {
    for (let key in fileTypes) {
        let values = fileTypes[key];
        for (let i = 0; i < values.length; i++) {
            if (_.endsWith(filename, values[i])) return(key)
        }
    }
    // default value
    return 'file'
};

let fileTypeStripper = (filePath) => {
    filePath = _.startsWith(filePath, "/") ? filePath.substr(1) : filePath;
    return filePath;
};


const FilesComponent = ({files, filesLoaded}) => (
    <List divided relaxed loading={!filesLoaded}>
        {files.map(file => (
            <List.Item>
                <List.Icon name={fileTypeMapper(file.name)} size='large' verticalAlign='middle' />
                <List.Content>
                    <List.Header as='a' download href={fileTypeStripper(file.path)}>{file.name}</List.Header>
                    <List.Description as='a'>{format(file.mtime)}, {filesize(file.size)}</List.Description>
                </List.Content>
            </List.Item>
        ))}
    </List>
);


const mapStateToProps = (state, ownProps) => {
    let dataset = state.datasetsByTokens[ownProps.token];
    let {files, filesLoaded} = dataset;
    return {files, filesLoaded}
};

const mapDispatchToProps = dispatch => ({});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(FilesComponent)