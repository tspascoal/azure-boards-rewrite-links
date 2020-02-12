"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const common = require("./common");
const WorkItemTrackingInterfaces = require("azure-devops-node-api/interfaces/WorkItemTrackingInterfaces");
const VSSInterfaces_1 = require("azure-devops-node-api/interfaces/common/VSSInterfaces");
const Colors = require("colors/safe");
function getSuiteTitlePrefix(requirementId) {
    return `[${requirementId}]`;
}
function getQuery(witApi, project, queryName) {
    return __awaiter(this, void 0, void 0, function* () {
        common.heading(`Getting query ${queryName}`);
        const query = yield witApi.getQuery(project.id, queryName, WorkItemTrackingInterfaces.QueryExpand.Wiql);
        if (query === null) {
            console.error(`query ${queryName} not found`);
            process.exit(-1);
        }
        return query;
    });
}
function getTopLevelItems(witApi, query) {
    return __awaiter(this, void 0, void 0, function* () {
        common.heading('Executing Query');
        if (query.queryType !== WorkItemTrackingInterfaces.QueryType.OneHop) {
            console.error("Error: Only support tree based queries.");
            throw "Query type not supported";
        }
        const queryResults = witApi.queryById(query.id);
        return (yield queryResults).workItemRelations
            .filter(wirel => wirel.rel == null && wirel.source == null)
            .sort((a, b) => a.target.id - b.target.id);
    });
}
function run(organizationUrl, projectName, planName, queryName, relationType, keepOriginalComment) {
    return __awaiter(this, void 0, void 0, function* () {
        const webApi = yield common.getWebApi(organizationUrl);
        const witApi = yield webApi.getWorkItemTrackingApi();
        const coreApiObject = yield webApi.getCoreApi();
        const project = yield coreApiObject.getProject(projectName);
        const query = yield getQuery(witApi, project, queryName);
        const topLevelWorkItems = yield getTopLevelItems(witApi, query);
        if (topLevelWorkItems.length === 0) {
            console.log(Colors.yellow("Query returned no results"));
        }
        else {
            common.result(`Query returned ${topLevelWorkItems.length} top level items.`);
            return;
            let numberWorkItemsUpdated = 0;
            let numberLinksUpdated = 0;
            for (var item in topLevelWorkItems) {
                const workItemId = topLevelWorkItems[item].target.id;
                let jsonPatch;
                let operations = [];
                const workItem = yield witApi.getWorkItem(workItemId, null, null, WorkItemTrackingInterfaces.WorkItemExpand.Relations);
                common.heading(`Examining ${workItemId} ${workItem.fields["System.Title"]}`);
                let relationCounter = 0;
                let numberChanges = 0;
                for (var rel in workItem.relations) {
                    const relation = workItem.relations[rel];
                    if (relationType.includes(relation.rel)) {
                        let newComment = `Migration: original link type ${relation.attributes['name']}.`;
                        if (keepOriginalComment && relation.attributes['comment']) {
                            newComment += ` Original comment: ${relation.attributes['comment']}`;
                        }
                        let operationAdd = {
                            op: VSSInterfaces_1.Operation.Add,
                            path: "/relations/-",
                            value: {
                                rel: "System.LinkTypes.Related",
                                url: relation.url,
                                attributes: {
                                    comment: newComment
                                }
                            }
                        };
                        let operationRemove = {
                            op: VSSInterfaces_1.Operation.Remove,
                            path: `/relations/${relationCounter}`
                        };
                        operations.push(operationAdd, operationRemove);
                        numberChanges++;
                    }
                    relationCounter++;
                }
                if (operations.length > 0) {
                    jsonPatch = operations;
                    const result = yield witApi.updateWorkItem(null, jsonPatch, workItem.id);
                    numberWorkItemsUpdated++;
                    numberLinksUpdated += numberChanges;
                    common.result(Colors.green(`Updated ${numberChanges} link(s)`));
                }
            }
            console.log(Colors.green(`Updated ${numberLinksUpdated} links in ${numberWorkItemsUpdated}`));
        }
    });
}
exports.run = run;
///////////////////////////////////////////////////// main
if (process.env["API_TOKEN"] === null) {
    console.error("You need to define an environment variable called API_TOKEN with your Personal access token (PAT)");
    process.exit(-3);
}
const yargs = require('yargs');
const argv = require('yargs')
    .usage('Usage: $0 -org organizationUrl -plan planName -query queryName')
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
    .argv;
run(argv.org, argv.project, argv.plan, argv.query, argv.relType, argv.keepOriginalComment);
