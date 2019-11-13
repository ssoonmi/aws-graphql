# How to set up AWS S3 with GraphQL and Express

## 1. Set Up
#### Packages to install in your backend
- graphql-upload
- aws-sdk

#### Packages to install in your frontend
- apollo-upload-client

#### Create your AWS Bucket
Navigate to [https://s3.console.aws.amazon.com/s3/home?region=us-east-1](https://s3.console.aws.amazon.com/s3/home?region=us-east-1) click on “create bucket”, enter a name, choose a region, and leave all other options as default.

## 2. Allow your app to take multiple different content types in your backend
Your express app needs to be able accept multipart/form-data requests. To do that, you will use the `graphQLUploadExpress` from the `graphql-upload` package.

### `graphQLUploadExpress`
This middleware will make it so that the `/graphql` path will only accept multipart/form-data requests.

In `server.js`, require it at the top, `const { graphQLUploadExpress } = require('graphql-upload');`

Then, in `server.js`, use it as the middleware for your `/graphql` path: 
```javascript
app.use(
  "/graphql",
  // use graphQLUploadExpress as the middleware for /graphql path
  graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }),
  expressGraphQL({
    schema,
    graphiql: true
  })
);
```

> If you want to know more about `graphqlUploadExpress` and how to use it, look here:
> [https://github.com/jaydenseric/graphql-upload#function-graphqluploadexpress](https://github.com/jaydenseric/graphql-upload#function-graphqluploadexpress)

## 3. Set up AWS S3 in your backend
### `s3.js`
Make a file called `s3.js` in your `schema` folder or in your `services` folder.
In there, you will use the package, `aws-sdk`, set up your credentials for aws, and then export it.

```javascript
const AWS = require("aws-sdk");
if (process.env.NODE_ENV !== "production") {
  AWS.config.loadFromPath("./credentials.json");
}
const s3 = new AWS.S3({ apiVersion: "2006-03-01" });

module.exports = { s3 };
```
#### `AWS.config.loadFromPath`
This function is allowing us to configure our aws keys using a json file. 
> You can learn more about how this works here:
> [https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-json-file.html](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-json-file.html)

#### How to set up your credentials in production
You do not need a credentials.json in production. Instead, all you need to do is set environmental keys for `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`.

> You can read more about how AWS uses the environment variables here:
> [https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-environment.html](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-environment.html)

### `credentials.json`
> [How to Get Your Access Keys](https://help.bittitan.com/hc/en-us/articles/115008255268-How-do-I-find-my-AWS-Access-Key-and-Secret-Access-Key-)

Make a file called `credentials.json` **at the root** of your project.
In there, you will set your aws credentials.
```json
{
  "accessKeyId": "<Your AWS Access Key ID>",
  "secretAccessKey": "<Your AWS Secret Access Key>",
  "region": "us-east-1"
}
```
**MAKE SURE TO GITIGNORE THIS FILE**

### `singleFileUpload`
We are going to create a function that accepts a **single** file, uploads it to our AWS S3 bucket, and returns the key to retrieve it from your bucket later (this will be saved to our database).
In `s3.js`, define the following function: 
```javascript
const singleFileUpload = async file => {
  const { filename, mimetype, createReadStream } = await file;
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
  return result.Key;
};
```
Export this from your `s3.js`: 
```javascript
module.exports = { s3, singleFileUpload };
```

> I followed the instructions for creating a filestream (`createReadStream`) here: 
> [https://github.com/jaydenseric/graphql-upload#class-graphqlupload](https://github.com/jaydenseric/graphql-upload#class-graphqlupload)

> Then I followed the instructions for uploading to AWS S3 using that stream here, underneath the section "Configure the Server and AWS SDK":
> [File Upload With GraphQL Using Apollo Server](https://medium.com/@enespalaz/file-upload-with-graphql-9a4927775ef7)

## 4. Mutations in your backend
In your backend's Mutation file, we will import the `singleFileUpload` function we just created. (eg. `const { singleFileUpload } = require("./s3")`)

### `GraphQLUpload`
We will also import the GraphQL type `GraphQLUpload` from the package `graphql-upload`: 
`const { GraphQLUpload } = require('graphql-upload');`
> If you want to read more about GraphQLUpload, you can do so here: 
> [https://github.com/jaydenseric/graphql-upload#class-graphqlupload](https://github.com/jaydenseric/graphql-upload#class-graphqlupload)

### Example Mutation (newUser)
In this example mutation, we are going to be uploading an `image` to a `User`. 

The args for the mutation will have a key of `image` that has a `type` of `GraphQLUpload`. 

The resolve function is asynchronous and will be calling `singleFileUpload`, passing in `image` from `args`. 

Afterwards, the return on the `singleFileUpload` will be saved as the `image` key on the new `User.

```javascript
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
```

## 5. Queries in your backend
Now that we have upload to AWS S3 in our backend set up, we also need to be able to retrieve the files that we just uploaded.
We can do so by using the function `getSignedUrl` on the package, `aws-sdk`.

### `getSignedUrl`
`getSignedUrl` generates a secure url using our AWS credentials for our file that we uploaded and allows us to keep our AWS S3 files private.

**We do not need to make any of the files or the bucket on AWS S3 public if we use `getSignedUrl`**

It expects us to give it the key that we saved to our database. 

```javascript
const params = { Bucket: '<Name of your bucket>', Key: '<Key that we saved to our database>' };
const url = s3.getSignedUrl('getObject', params);
console.log('The URL we can send up to our frontend', url);
```

> To learn more about the `getSignedUrl` function, look here: 
> [https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#getSignedUrl-property](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#getSignedUrl-property)

### Example Query (UserType)
We want the `image` field on a GraphQL `UserType` to return the url of the image saved on AWS S3. But the `image` field on a `User` document is currently just the key to the file in our S3 bucket. We need to add a resolve to the `image` field on a `UserType` that will return the actual url of our file. 

First, we import `s3` from the `s3.js` file that we created before at the top of the `UserType.js` file. 

Then we create a resolve function on the `image` field and call `s3.getSignedUrl`, passing in as the key, `parentValue.image`.

We return the url that `s3.getSignedUrl` returns.

```javascript
const { GraphQLObjectType, GraphQLID, GraphQLString } = require('graphql');
const { s3 } = require('./s3');

const UserType = new GraphQLObjectType({
  name: 'UserType',
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    email: { type: GraphQLString },
    // to retrieve the image from aws
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
```

**Great! Now we finally finished setting up the backend. Let's set up the frontend.**

## 6. Configuring Apollo Client in our frontend
Instead of using `createHttpLink` from `apollo-link-http`, we will be using `createUploadLink` from `apollo-upload-client` in our `client/index.js` file.

### `createUploadLink` from apollo-link-client
`createUploadLink` is what we will use in place of `createHttpLink`. We can invoke `createUploadLink` with the same options object that we passed into `createHttpLink`.

It will allow us to file upload using GraphQL on our frontend.

> To learn more about the function `createUploadLink`, see here:
> [https://github.com/jaydenseric/apollo-upload-client#function-createuploadlink](https://github.com/jaydenseric/apollo-upload-client#function-createuploadlink)

```javascript
//... other imports
import { createUploadLink } from 'apollo-upload-client';

//... setting up cache

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

```

## 7. Queries on our frontend
Queries will stay the same as they were before.

## 8. Mutations on our frontend
Mutations are the way that we post information to our backend. 

Two files to look at are `client/src/graphql/mutations.js` and `client/src/components/CreateUser.js`

### Defining a GraphQL Mutation
In `client/src/graphql/mutations.js`, we are defining a mutation called `CreateUser` that will be able to accept the variables, `name`, `email`, and `image`. `name` and `email`'s types will be `String`, but the `image`'s type will be `Upload`.

```javascript
import gql from "graphql-tag";

// the type for $image is Upload
export const CREATE_USER = gql`
  mutation CreateUser($name: String!, $email: String!, $image: Upload!) {
    newUser(name: $name, email: $email, image: $image) {
      id
      name
      email
      image
    }
  }
`;
```

### Making an Apollo Mutation
In `client/src/components/CreateUser.js`, we are making the component `CreateUser` that will make the `CreateUser` mutation once the form is submitted.

The only thing that looks out of the ordinary from a regular Apollo Mutation is how the input type file is defined inside of the form. 

```javascript
<input
  type="file"
  required
  onChange={({
    target: {
      validity,
      files: [file]
    }
  }) => validity.valid && this.setState({ image: file })}
/>
```

**And voila! We finished setting up the frontend to accept files in GraphQL!**

See the [Live Version here](https://aws-s3-graphql.herokuapp.com/#/)
