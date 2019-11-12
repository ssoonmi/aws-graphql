const mongoose = require("mongoose");
const {
  GraphQLObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLNonNull
} = require("graphql");
const UserType = require("./UserType");
const User = mongoose.model("user");
const { GraphQLUpload } = require('graphql-upload');

const AWS = require("aws-sdk");
AWS.config.loadFromPath("./credentials.json");
const s3 = new AWS.S3({ apiVersion: "2006-03-01" });

const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: () => ({
    newUser: {
      type: UserType,
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
        email: { type: new GraphQLNonNull(GraphQLString) },
        image: { type: GraphQLUpload }
      },
      async resolve(_, { name, email, image }) {
        const updateObj = {};
        if (name) updateObj.name = name;
        if (email) updateObj.email = email;
        if (image) {
          const { filename, mimetype, createReadStream } = await image;
          const fileStream = createReadStream();
          // Promisify the stream and store the file, then…
          const Key = new Date().getTime().toString();
          const uploadParams = {
            Bucket: "aws-graphql-dev-testing",
            Key,
            Body: fileStream
          };
          const result = await s3.upload(uploadParams).promise();

          updateObj.image = result.Key;
        }

        return new User(updateObj).save();
      }
    }
  })
});

module.exports = Mutation;