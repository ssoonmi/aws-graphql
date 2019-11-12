const { GraphQLObjectType, GraphQLID, GraphQLString } = require('graphql');
const AWS = require("aws-sdk");
AWS.config.loadFromPath("./credentials.json");
const s3 = new AWS.S3({ apiVersion: "2006-03-01" });

const UserType = new GraphQLObjectType({
  name: 'UserType',
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    email: { type: GraphQLString },
    image: { 
      type: GraphQLString,
      resolve(parentValue) {
        let imageUrl;
        if (parentValue.image) {
          imageUrl = s3.getSignedUrl('getObject', {
            Bucket: "aws-graphql-dev-testing",
            Key: parentValue.image
          });
        }
        return imageUrl || parentValue.image;
      }
    }
  })
});

module.exports = UserType;