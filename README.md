This project is a suite of TAP integration tests with CloudMine specifically for Access Lists (ACLs). ACLs allow users to control object and file permissions between users on CloudMine. A list contains the user ids that the ACL applies to along with the CRUD operations the list permits. Once a list is created, any user can append the id of the ACL to the __access__ field of a CloudMine object. Users contained in the list will have the permitted CRUD capbility once the object is saved. While the ACL id can be applied to an object by any user, the list itself can only be modified by the creator. This allows developers to create features like a managed admin list with read and update permissions on user objects or for users to create their own permissions lists to append to objects controlling the shared aspects of their user data. ",
  

## Configuring the Environment

On a clean checkout when running tests manually, copy the env.example.sh file to env.sh, set all the relevant environment variables there, and source it

```
$ . env.sh
```


When running in an automated environment, check the env.sh/env.example.sh file for all the environment variables that must be defined for the tests to run.

## Running all tests

To run all tests (everything in a .js file), run

```
$ npm test
```

## Running individual tests

Any individual test file can also be run with node

```
$ node my_test.js
```


## Practical ACL use cases

These tests make a permissions list on the fly and recycles the IDs of those lists throughout the tests. In production I would recommend that any constant lists (admin privelage lists) be appended to the object with a post save server execution snippet. For examples on how to run a snippet with a client save call checkout:

https://github.com/Splat/SnippetSamples

The tests folder in that repo shows how to create a user on the client side and have a snippet which runs off those results. And object creation or update call forwards the results of that call to the snippet which contains the record ID. The snippet can then load the object and append the constant admin lists and any necessary user created lists without exposing the information on the lists to end users. 

Checkout the docs for all the values which are passed into snippets by default and what you can pass in specific to the use case here:

https://cloudmine.me/docs/#/server_code#api-interface
