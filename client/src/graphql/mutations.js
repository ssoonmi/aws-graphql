import gql from "graphql-tag";

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
