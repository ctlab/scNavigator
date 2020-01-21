import React, {Component} from 'react';
import {Tab} from 'semantic-ui-react';
import {
    getOpenTabsOrdered, tabClasses, tabNames
} from "../reducers/Tabs";




class DatasetComponent extends Component {
    componentDidMount() {

        // removing first slash, so fetch takes relative path
        let plotDataUrl = this.props.plotDataFile.substr(1);
        let markersDataUrl = this.props.markersFile.substr(1);
        let expDataUrl = this.props.expressionFile.substr(1);


        fetch(plotDataUrl, {headers: {'Accept-Encoding': 'gzip'}})
            .then(res => res.json())
            .then(data => this.props.loadedPlotData(this.props.token, data));

        fetch(markersDataUrl, {headers: {'Accept-Encoding': 'gzip'}})
            .then(res => res.json())
            .then(data => this.props.loadedMarkersData(this.props.token, data));

        fetch(expDataUrl, {headers: {'Accept-Encoding': 'gzip'}})
            .then(res => res.json())
            .then(data => this.props.loadedExpData(this.props.token, data));

        fetch("sce/getPathwayNames/", {headers: {'Accept-Encoding': 'gzip'}})
            .then(res => res.json())
            .then(data => this.props.loadedPathwaysData(this.props.token, data));

        fetch("sce/getFiles/?token=" + this.props.token)
            .then(res => res.json())
            .then(data => this.props.loadedFilesData(this.props.token, data));

    };

    render() {

        let content;

        if (this.props.plotDataLoaded) {

            let panes = [];
            let openTabs = getOpenTabsOrdered(this.props.openTabs);

            for (let i = 0; i < openTabs.length; i++) {
                let tab = openTabs[i];
                let key = this.props.token.concat(tab);
                let name = tabNames[tab];
                panes.push({
                    menuItem: name, pane: {
                        key: key,
                        content: React.createElement(tabClasses[tab], {token: this.props.token, tab: tab}, null)
                    }
                });
            }

            content = (
                <Tab.Pane>
                    <Tab grid={{paneWidth: 13, tabWidth: 3}}
                         style={{height: "100%"}}
                         menu={{fluid: true, vertical: true}}
                         menuPosition='left'
                         panes={panes}
                         renderActiveOnly={false}
                         activeIndex={this.props.currentTab}
                         onTabChange={(e, data) => {
                            this.props.changeCurrentTab(this.props.token, data.activeIndex);
                         }}
                         id={this.props.token}/>
                </Tab.Pane>);

        } else {
            content = <Tab.Pane loading> </Tab.Pane>;
        }

        return (content);
    }

}

export default DatasetComponent;