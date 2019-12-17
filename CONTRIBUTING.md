# Contribution Guidelines

## Setting-up this project locally

### Installation
```sh
git clone git@github.com:raml-org/playground.git
cd playground
git checkout develop
git clone git@github.com:raml-org/playground.git docs
cd docs
git checkout gh-pages
cd ..
npm install
gulp bundleAll
```

### Running examples
To run a demo, execute corresponding gulp `serve...` command. To get a list of all available `serve...` commands, please see [gulpfile.js](https://github.com/raml-org/playground/blob/master/gulpfile.js).

## Creating pull requests
Please create source code PRs to branch `develop` and html/css/etc to branch `gh-pages`.

Before creating a PR, make sure to run `gulp bundleAll` so all the code is compiled/compressed. If you've followed [installation instructions](#installation), running `gulp bundleAll` should update both source code and compiled gh-pages code. This will allow you switch to `docs` directory and create a PR to `gh-pages` branch as well.
