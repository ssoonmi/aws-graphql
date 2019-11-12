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
const s3 = require("./s3");

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
          const { filename, mimetype, createReadStream } = await image;
          const fileStream = createReadStream();
          const path = require("path");
          // name of the file in your S3 bucket will be the date in ms plus the extension name
          const Key = new Date().getTime().toString() + path.extname(filename);
          const uploadParams = {
            // name of your bucket here
            Bucket: "aws-graphql-dev-testing",
            Key,
            Body: fileStream
          };
          const result = await s3.upload(uploadParams).promise();

          // save the name of the file in your bucket as the key in your database to retrieve for later
          updateObj.image = result.Key;
        }

        return new User(updateObj).save();
      }
    }
  })
});

module.exports = Mutation;