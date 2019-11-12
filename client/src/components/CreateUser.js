import React from "react";
import { Mutation } from "react-apollo";
import { CREATE_USER } from '../graphql/mutations';
import { FETCH_USERS } from '../graphql/queries';

class CreateUser extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: "",
      email: "",
      image: null
    };
  }

  update(field) {
    return e => this.setState({ [field]: e.target.value });
  }

  updateImage(file) {
    this.setState({ image: file });
  }

  handleSubmit(e, createUser) {
    e.preventDefault();
    const { name, email, image } = this.state;
    createUser({
      variables: { name, email, image }
    });
  }

  updateCache(cache, { data }) {
    let users;
    try {
      // if we've already fetched the posts then we can read the
      // query here
      users = cache.readQuery({ query: FETCH_USERS });
    } catch (err) {
      return;
    }
    // if we had previously fetched products we'll add our new product to our cache
    if (users) {
      let userArray = users.users;
      let newUser = data.newUser;
      userArray = userArray.concat([newUser]);

      cache.writeQuery({
        query: FETCH_USERS,
        data: { users: userArray }
      });
    }
  }

  render() {
    return (
      <Mutation
        mutation={CREATE_USER}
        onError={err => this.setState({ message: err.message })}
        update={(cache, data) => this.updateCache(cache, data)}
        onCompleted={data => {
          const { name } = data.newUser;
          this.setState({
            message: `New user '${name}' created successfully`
          });
        }}
      >
        {(createUser, data) => {
          return (
            <div>
              <form onSubmit={e => this.handleSubmit(e, createUser)}>
                <input
                  type="text"
                  onChange={this.update("name")}
                  value={this.state.name}
                  placeholder="Name"
                />
                <input
                  type="email"
                  onChange={this.update("email")}
                  value={this.state.email}
                  placeholder="Email"
                />
                <input
                  type="file"
                  required
                  onChange={({
                    target: {
                      validity,
                      files: [file]
                    }
                  }) => validity.valid && this.updateImage(file)}
                />
                <input type="submit" value="Create User" />
              </form>
              {this.state.message}
            </div>
          );
        }}
      </Mutation>
    );
  }
}

export default CreateUser;
