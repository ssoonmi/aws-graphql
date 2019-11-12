import gql from "graphql-tag";

export const FETCH_USERS = gql`
  query FetchUsers {
    users {
      id
      name
      email
      image
    }
  }
`;
