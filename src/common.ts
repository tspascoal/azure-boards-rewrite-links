import * as vm from "azure-devops-node-api";
import * as lim from "azure-devops-node-api/interfaces/LocationsInterfaces";

function getEnv(name: string): string {
    let val = process.env[name];
    if (!val) {
        console.error(`${name} env var not set`);
        process.exit(1);
    }
    return val;
}

export async function getWebApi(serverUrl: string): Promise<vm.WebApi> {
    return new Promise<vm.WebApi>(async (resolve, reject) => {
        try {
            let token = getEnv("API_TOKEN");
            let authHandler = vm.getPersonalAccessTokenHandler(token);
            let option = undefined;

            let vsts: vm.WebApi = new vm.WebApi(serverUrl, authHandler, option);
            let connData: lim.ConnectionData = await vsts.connect();
            console.log(`Hello ${connData.authenticatedUser.providerDisplayName} you are connected to ${serverUrl}`);
            resolve(vsts);
        }
        catch (err) {
            reject(err);
        }
    });
}

export function heading(title: string): void {
    console.log();
    console.log(`> ${title}`);
}

export function result(title: string): void {
    console.log(`    ${title}`);
}
