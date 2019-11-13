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
const { singleFileUpload } = require("./s3");

const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: () => ({
    newUser: {
      type: UserType,
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
        email: { type: new GraphQLNonNull(GraphQLString) },
        // type for the image file is GraphQLUpload
        image: { type: GraphQLUpload }
      },
      async resolve(_, { name, email, image }) {
        const updateObj = {};
        if (name) updateObj.name = name;
        if (email) updateObj.email = email;
        if (image) {
          updateObj.image = await singleFileUpload(image);
        }

        return new User(updateObj).save();
      }
    }
  })
});

module.exports = Mutation;