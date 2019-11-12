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

module.exports = s3;