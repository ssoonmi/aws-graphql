const AWS = require("aws-sdk");
if (process.env.NODE_ENV !== "production") {
  AWS.config.loadFromPath("./credentials.json");
}
// else {
// make sure to set environment variables in production for:
// AWS_ACCESS_KEY_ID
// AWS_SECRET_ACCESS_KEY
// and aws will automatically use those environment variables
// }
const s3 = new AWS.S3({ apiVersion: "2006-03-01" });

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

module.exports = { s3, singleFileUpload };