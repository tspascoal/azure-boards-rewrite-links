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
const vm = require("azure-devops-node-api");
function getEnv(name) {
    let val = process.env[name];
    if (!val) {
        console.error(`${name} env var not set`);
        process.exit(1);
    }
    return val;
}
function getWebApi(serverUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                let token = getEnv("API_TOKEN");
                let authHandler = vm.getPersonalAccessTokenHandler(token);
                let option = undefined;
                let vsts = new vm.WebApi(serverUrl, authHandler, option);
                let connData = yield vsts.connect();
                console.log(`Hello ${connData.authenticatedUser.providerDisplayName} you are connected to ${serverUrl}`);
                resolve(vsts);
            }
            catch (err) {
                reject(err);
            }
        }));
    });
}
exports.getWebApi = getWebApi;
function heading(title) {
    console.log();
    console.log(`> ${title}`);
}
exports.heading = heading;
function result(title) {
    console.log(`    ${title}`);
}
exports.result = result;
