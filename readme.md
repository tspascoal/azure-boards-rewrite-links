# Rewrite Links

Basic script that rewrites a set of relations between work items to a related (and keeps the original link type on a comment).

The rewritten work relations are read from a query you need to setup (to filter the work items that are going to be rewritten).

Links that are not be specified will be left unchanged (multiple link types can be specified).

## Pre requirements

node
run npm install on the main folder go install dependencies by issuing the command

> npm install --only=prod

A PAT token with the following scopes

* Work Items - Read & Write

Set an environment variable called API_TOKEN with the value of the token

In windows use 
> set API_TOKEN=XXXXXX
In Linux use
> export API_TOKEN=XXXXXX

The token is NOT persisted anywhere so you need to set it every time you start a new shell

## Usage

node rewrite-links.js --org https://dev.azure.com/XXXX --project projectName --query "My Queries/Rewrite Query" --relType System.LinkTypes.Hierarchy-Forward System.LinkTypes.Duplicate-Forward
