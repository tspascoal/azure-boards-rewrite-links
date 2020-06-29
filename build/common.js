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
exports.result = exports.heading = exports.getWebApi = void 0;
const vm = require("azure-devops-node-api");
function getEnv(name) {
    const val = process.env[name];
    if (!val) {
        console.error(`${name} env var not set`);
        process.exit(1);
    }
    return val;
}
function getWebApi(serverUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            try {
                const token = getEnv("API_TOKEN");
                const authHandler = vm.getPersonalAccessTokenHandler(token);
                const option = undefined;
                const vsts = new vm.WebApi(serverUrl, authHandler, option);
                vsts.connect()
                    .then((connData) => {
                    console.log(`Hello ${connData.authenticatedUser.providerDisplayName} you are connected to ${serverUrl}`);
                    resolve(vsts);
                })
                    .catch((err) => {
                    console.error("failed connecting", err);
                });
            }
            catch (err) {
                reject(err);
            }
        });
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
