# Rewrite Links

Basic script that rewrites a set of relations between work items to a related (and keeps the original link type on a comment).

The rewritten work relations are read from a query you need to setup (to filter the work items that are going to be rewritten).

Links that are not be specified will be left unchanged (multiple link types can be specified).

## Pre requirements

node
azure-boards-rewrite-links npm package

The package can be installed by calling

> npm install azure-boards-rewrite-links

You will also node

A PAT token with the following scopes

* Work Items - Read & Write

Set an environment variable called API_TOKEN with the value of the token

In windows use
> set API_TOKEN=XXXXXX

In Linux use
> export API_TOKEN=XXXXXX

The token is NOT persisted anywhere so you need to set it every time you start a new shell

> Note if you have installed the package locally and not globally you need to make sure that `node_modules/.bin` (relative to install path) is on path.


## Usage

az-boards-rewrite-links --org https://dev.azure.com/XXXX --project projectName --query "My Queries/Rewrite Query" --relType System.LinkTypes.Hierarchy-Forward System.LinkTypes.Duplicate-Forward
