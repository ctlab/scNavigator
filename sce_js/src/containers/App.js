import React from 'react';
import {connect} from 'react-redux';
import '../App.css';
import 'react-table/react-table.css'
import { Tab, Menu, Button } from 'semantic-ui-react';
import MainPage from "../components/MainPage.js";
import Dataset from "./Dataset";
import { changeCurrentWindow, closeWindow } from "../actions";
import _ from 'lodash';


const buttonTags = ["button", "i"];

const App = ({datasetsTokens, currentWindow, dispatch}) => {
  let panes = [{
    menuItem: "Single-cell Explorer: Beta",
    pane: {
      key: "main",
      content: (<MainPage />)
    }}];

  const datasetPanes = datasetsTokens.map(
      (dataset) =>
      {
        return({
          menuItem: (<Menu.Item key={dataset}>{dataset + "  "}
          <Button style={{padding: 0, 'margin-left': 10}}
                  icon='close'
                  size='mini'
                  onClick={(e) => dispatch(closeWindow(dataset))} />
          </Menu.Item>),
          pane: {
            key: dataset,
            content:(<Dataset token={dataset} />)
          }})
      }
  );
  panes.push.apply(panes, datasetPanes);

  return (
      <Tab menu={{ attached: false, tabular: false }}
           onTabChange={(e, data) => {
             let tagName = e.target.tagName.toLowerCase();
             if (_.filter(buttonTags, e => e === tagName).length === 0) {
               dispatch(changeCurrentWindow(data.activeIndex))
             }
           }}
           panes={panes}
           activeIndex={currentWindow}
           renderActiveOnly={false} />
  );

};


let mapStateToProps = (state, ownProps) => {
  let { datasetsTokens, currentWindow } = state;
  return {
    datasetsTokens,
    currentWindow
  }
};

export default connect(mapStateToProps)(App);
