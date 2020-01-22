import {Grid, Tab} from "semantic-ui-react";
import TokenInput from "../containers/TokenInput";
import React, {Component} from "react";
import PublicDatasets, {CuratedDatasets} from "../containers/PublicDatasets";
import {fetchPublicDatasets} from "../actions";
import {connect} from "react-redux";


class MainPage extends Component {

    componentDidMount() {
        this.props.fetchPublicDatasets();
    }

    render() {
        let mainPagePanes = [
            { menuItem: 'Curated datasets', render: () => <Tab.Pane><CuratedDatasets /></Tab.Pane> },
            { menuItem: 'All scRNA-seq datasets', render: () => <Tab.Pane><PublicDatasets /></Tab.Pane> },
            { menuItem: 'Gene signature search', render: () => <Tab.Pane><PublicDatasets /></Tab.Pane> },
        ];
        return (
            <Tab.Pane>
                <div className="ui sizer vertical segment">
                    <div className="ui huge header">scNavigator: beta</div>
                    <p>Single-cell Navigator is an open-source project dedicated to processing and visualization of
                        single-cell RNA-seq data</p>
                    <p>
                        Below we have a large collection of datasets and tools to play with:
                        <ul>
                            <li> Collection of curated datasets. Curated dataset are those that we process by hand.
                                These include datasets from Human Cell Atlas (HCA), Tabula Muris and some of the datasets that
                                we generated in our lab.</li>
                            <li> Large collection of automatically processed datasets.
                                We processed almost every scRNA-seq dataset from GEO Omnibus database.
                                We make it available for you in our browser.
                            </li>
                            <li>
                                You can search for cell type specific gene signatures! When we processed all the public scRNA-seq datasets
                                we also calculated all the markers of all the clusters in all these datasets. Just put a list of genes and we
                                will tell you which cluster in which dataset it looks like.
                            </li>
                            <li>
                                If you were provided with secret dataset token, you can use it at the very bottom of the page
                            </li>
                        </ul>

                    </p>

                    <Tab panes={mainPagePanes} />

                    <br/><br/>
                    <p> Enter a secret token below: </p>
                    <Grid divided='vertically'>
                        <Grid.Row columns={3}>
                            <Grid.Column>
                                <TokenInput />
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                </div>
            </Tab.Pane>
        );
    }

}

const mapDispatchToProps = dispatch => ({
    fetchPublicDatasets: () => dispatch(fetchPublicDatasets()),
});

export default connect(
    null,
    mapDispatchToProps
)(MainPage);