#!/usr/bin/env node

import * as common from './common'
import * as nodeApi from 'azure-devops-node-api' // eslint-disable-line @typescript-eslint/no-unused-vars
import * as WorkItemTrackingApi from 'azure-devops-node-api/WorkItemTrackingApi' // eslint-disable-line @typescript-eslint/no-unused-vars

import * as CoreApi from 'azure-devops-node-api/CoreApi' // eslint-disable-line @typescript-eslint/no-unused-vars
import * as WorkItemTrackingInterfaces from 'azure-devops-node-api/interfaces/WorkItemTrackingInterfaces'
import * as CoreInterfaces from 'azure-devops-node-api/interfaces/CoreInterfaces' // eslint-disable-line @typescript-eslint/no-unused-vars

import { JsonPatchDocument, JsonPatchOperation, Operation } from "azure-devops-node-api/interfaces/common/VSSInterfaces" // eslint-disable-line @typescript-eslint/no-unused-vars


import Colors = require('colors/safe')
import yargs = require('yargs')

async function getQuery(witApi: WorkItemTrackingApi.IWorkItemTrackingApi, project: CoreInterfaces.TeamProject, queryName: string) {
    common.heading(`Getting query ${queryName}`)

    const query = await witApi.getQuery(project.id, queryName, WorkItemTrackingInterfaces.QueryExpand.Wiql)

    if (query === null) {
        console.error(`query ${queryName} not found`)
        process.exit(-1)
    }
    return query
}

async function getTopLevelItems(witApi: WorkItemTrackingApi.IWorkItemTrackingApi, query: WorkItemTrackingInterfaces.QueryHierarchyItem) {
    common.heading('Executing Query')

    if (query.queryType !== WorkItemTrackingInterfaces.QueryType.OneHop) {
        console.error("Error: Only support tree based queries.")

        throw "Query type not supported"
    }

    const queryResults = witApi.queryById(query.id)

    return (await queryResults).workItemRelations
        .filter(wirel => wirel.rel == null && wirel.source == null)
        .sort((a, b) => a.target.id - b.target.id)
}

export async function run(organizationUrl: string, projectName: string, queryName: string, relationType: string[], keepOriginalComment: boolean) : Promise<void> {

    const webApi: nodeApi.WebApi = await common.getWebApi(organizationUrl)

    const witApi: WorkItemTrackingApi.IWorkItemTrackingApi = await webApi.getWorkItemTrackingApi()
    const coreApiObject: CoreApi.CoreApi = await webApi.getCoreApi()
    const project: CoreInterfaces.TeamProject = await coreApiObject.getProject(projectName)

    const query = await getQuery(witApi, project, queryName)

    const topLevelWorkItems = await getTopLevelItems(witApi, query)

    if (topLevelWorkItems.length === 0) {
        console.log(Colors.yellow("Query returned no results"))
    } else {
        common.result(`Query returned ${topLevelWorkItems.length} top level items.`)

        let numberWorkItemsUpdated = 0
        let numberLinksUpdated = 0
        for (const item in topLevelWorkItems) {

            const workItemId = topLevelWorkItems[item].target.id

            let jsonPatch: JsonPatchDocument
            const operations: Array<JsonPatchOperation> = []

            const workItem = await witApi.getWorkItem(workItemId, null, null, WorkItemTrackingInterfaces.WorkItemExpand.Relations)

            common.heading(`Examining ${workItemId} ${workItem.fields["System.Title"]}`)

            let relationCounter = 0
            let numberChanges = 0
            for (const rel in workItem.relations) {
                const relation = workItem.relations[rel]

                if (relationType.includes(relation.rel)) {

                    let newComment = `Migration: original link type ${relation.attributes['name']}.`

                    if (keepOriginalComment && relation.attributes['comment']) {
                        newComment += ` Original comment: ${relation.attributes['comment']}`
                    }

                    const operationAdd: JsonPatchOperation = {
                        op: Operation.Add,
                        path: "/relations/-",
                        value: {
                            rel: "System.LinkTypes.Related",
                            url: relation.url,
                            attributes: {
                                comment: newComment
                            }
                        }
                    }

                    const operationRemove: JsonPatchOperation = {
                        op: Operation.Remove,
                        path: `/relations/${relationCounter}`
                    }

                    operations.push(operationAdd, operationRemove)
                    numberChanges++
                }
                relationCounter++
            }

            if (operations.length > 0) {
                jsonPatch = operations

                await witApi.updateWorkItem(null, jsonPatch, workItem.id)
                numberWorkItemsUpdated++
                numberLinksUpdated += numberChanges
                common.result(Colors.green(`Updated ${numberChanges} link(s)`))

            }
        }
        console.log(Colors.green(`Updated ${numberLinksUpdated} links in ${numberWorkItemsUpdated} work item(s).`))
    }
}

///////////////////////////////////////////////////// main

if (process.env["API_TOKEN"] === null) {
    console.error("You need to define an environment variable called API_TOKEN with your Personal access token (PAT)")
    process.exit(-3)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const argv: any = yargs.options({ })
    .usage('Usage: $0 -org organizationUrl -p projectName -relType [list of rel ids] -query queryName -keepOriginalComment true|false')
    .demandOption(['org', 'project', 'query', 'relType'])
    .alias('org', 'organization')
    .alias('p', 'project')
    .describe('org', 'Organization url eg: https://dev.azure.com/myOrg')
    .describe('p', 'Team project name')
    .describe('query', 'Query Name (including path) eg: Shared Queries/Main Tests')
    .option('relType', {
        type: 'array',
        description: 'List of links to replace'
    })
    .option('keepOriginalComment', {
        type: 'boolean',
        default: false,
        description: 'keep original comment'
    })
    .argv


run(argv.org, argv.project, argv.query, argv.relType, argv.keepOriginalComment)
