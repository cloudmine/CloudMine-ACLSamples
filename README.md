This directory contains a simple tab-based test runner.

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
