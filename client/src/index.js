import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import ApolloClient from "apollo-client";
import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloProvider } from "react-apollo";
import { HashRouter } from "react-router-dom";
import { createUploadLink } from 'apollo-upload-client';

// import { VERIFY_USER } from "./graphql/mutations";
// import { FETCH_CART_ITEMS } from "./graphql/queries";

const cache = new InMemoryCache({
  dataIdFromObject: object => object._id || null
});

let uri = "http://localhost:5000/graphql";

if (process.env.NODE_ENV === 'production') {
  uri = "https://aws-s3-graphql.herokuapp.com/graphql";
}

const httpLink = createUploadLink({
  uri,
  headers: {
    authorization: localStorage.getItem("auth-token")
  }
});

const client = new ApolloClient({
  uri,
  link: httpLink,
  cache,
  onError: ({ networkError, graphQLErrors }) => {
    console.log("graphQLErrors", graphQLErrors);
    console.log("networkError", networkError);
  }
});


const Root = () => {
  return (
    <ApolloProvider client={client}>
      <HashRouter>
        <App />
      </HashRouter>
    </ApolloProvider>
  );
};

ReactDOM.render(<Root />, document.getElementById("root"));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();