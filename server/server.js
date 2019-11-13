const express = require("express");
const app = express();
const mongoose = require("mongoose");
const expressGraphQL = require('express-graphql');
// import graphQLUploadExpress
const { graphqlUploadExpress } = require('graphql-upload');
const db = require("./config/keys").mongoURI;
require('./models');
const cors = require("cors");
const schema = require('./schema/schema');
mongoose
.connect(db, { useNewUrlParser: true })
.then(() => console.log("Connected to MongoDB successfully"))
.catch(err => console.log(err));

if (process.env.NODE_ENV !== 'production') {
  let origin = "http://localhost:3000";
  app.use(cors({ origin }));
}


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

if (process.env.NODE_ENV === 'production') {
  app.use(express.static("client/build"));
  app.get("/", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}

module.exports = app;