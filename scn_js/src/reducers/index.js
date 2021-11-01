import { publicDatasets, publicDatasetsLoading } from "./PublicDatasetReducers";
import { token, tokenLoading} from "./TokenReducers";
import { datasetsByTokens, datasetsTokens} from "./DatasetReducers";
import { currentWindow } from "./AppReducers"
import { geneSignature } from "./GeneSigantureReducers";
import { singleGeneSearch } from "./SingleGeneSearchReducers";


let initState = () => {
    return {
        publicDatasets: [],
        publicDatasetsLoading: false,
        datasetsTokens: [],
        datasetsByTokens: {},

        tokenLoading: false,
        token: {
            value: "",
            isErrorInput: false,
            errorText: ""
        },

        currentWindow: 0,
        geneSearch: {
            searchLoading: false,
            searchField: "",
            speciesFrom: "mm",
            speciesTo: "mm",
            latestQuery: {},
            latestQuerySymbol: [],
            searchResults: {},
            collapseResults: "dataset" // values are 'study', 'dataset', and 'none'
        },

        singleGeneSearch: {
            searchLoading: false,
            searchField: "",
            latestQuery: {},
            searchResults: [],
        }

    };
};


const app = (state = initState(), action) => {
    return {
        publicDatasets: publicDatasets(state.publicDatasets, action),
        publicDatasetsLoading: publicDatasetsLoading(state.publicDatasetsLoading, action),
        token: token(state.token, action),
        tokenLoading: tokenLoading(state.tokenLoading, action),
        datasetsTokens: datasetsTokens(state.datasetsTokens, action),
        datasetsByTokens :datasetsByTokens(state.datasetsByTokens, action),
        currentWindow: currentWindow(state, action),
        geneSearch: geneSignature(state.geneSearch, action),
        singleGeneSearch: singleGeneSearch(state.singleGeneSearch, action)
    };
};

export default app;