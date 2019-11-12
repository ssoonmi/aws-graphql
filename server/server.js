const express = require("express");
const app = express();
const mongoose = require("mongoose");
const expressGraphQL = require('express-graphql');
// import graphQLUploadExpress
const { graphqlUploadExpress } = require('graphql-upload');
const db = require("../config/keys").mongoURI;
require('./models');
const cors = require("cors");
const schema = require('./schema/schema');
mongoose
.connect(db, { useNewUrlParser: true })
.then(() => console.log("Connected to MongoDB successfully"))
.catch(err => console.log(err));

app.use(cors());

// don't need to use bodyParser

app.use(
  "/graphql",
  // use graphQLUploadExpress as the middleware for /graphql path
  graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }),
  expressGraphQL({
    schema,
    graphiql: true
  })
);

app.get("/", (req, res) => res.send("Hello World"));

module.exports = app;