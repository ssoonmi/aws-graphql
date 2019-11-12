const {
  GraphQLSchema
} = require("graphql");

const RootQueryType = require("./RootQueryType");
const Mutation = require('./Mutation');

const schema = new GraphQLSchema({
  query: RootQueryType,
  mutation: Mutation
});

module.exports = schema;
