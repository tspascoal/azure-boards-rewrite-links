import * as vm from "azure-devops-node-api";
import * as lim from "azure-devops-node-api/interfaces/LocationsInterfaces";

function getEnv(name: string): string {
    const val = process.env[name];
    if (!val) {
        console.error(`${name} env var not set`);
        process.exit(1);
    }
    return val;
}

export async function getWebApi(serverUrl: string): Promise<vm.WebApi> {
    return new Promise<vm.WebApi>((resolve, reject) => {
        try {
            const token = getEnv("API_TOKEN");
            const authHandler = vm.getPersonalAccessTokenHandler(token);
            const option = undefined;

            const vsts: vm.WebApi = new vm.WebApi(serverUrl, authHandler, option);
            vsts.connect()
                .then((connData: lim.ConnectionData) => {
                    console.log(`Hello ${connData.authenticatedUser.providerDisplayName} you are connected to ${serverUrl}`);
                    resolve(vsts);
                })
                .catch((err) => {
                    console.error("failed connecting", err)
                });
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
