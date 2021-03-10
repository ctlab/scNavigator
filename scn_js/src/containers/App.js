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
const docsHref = "docs/";

const App = ({datasetsTokens, currentWindow, dispatch}) => {
  let panes = [{
    menuItem: "scNavigator: beta",
    pane: {
      key: "main",
      content: (<MainPage />)
    }}];

  let docsPane = {
    menuItem: (<Menu.Item position="right" href={docsHref} target='_blank'>Documentation</Menu.Item>),
    pane: {
      key: "scn_docs"
    }
  }

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
  panes.push(docsPane);

  return (
      <Tab menu={{ attached: false, tabular: false }}
           onTabChange={(e, data) => {
             let tagName = e.target.tagName.toLowerCase();
             if (e.target.attributes.hasOwnProperty("href")) {
               if (e.target.attributes["href"].value === docsHref) {
                 return
               }
             }

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
