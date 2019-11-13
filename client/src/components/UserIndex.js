import React from 'react';
import { Query } from "react-apollo";
import { FETCH_USERS } from '../graphql/queries';

function UserIndex() {
  return (
    <Query query={FETCH_USERS}>
      {({ loading, errors, data }) => {
        if (loading) return "Loading...";
        if (errors) return "Errors ${errors.message}";
        return (
          <ul>
            {data.users.map(user => {
              return (
                <li key={user.id}>
                  {user.name}
                  {user.email}
                  <img src={user.image} />
                </li>
              );
            })}
          </ul>
        );
      }}
    </Query>
  );
}

export default UserIndex;