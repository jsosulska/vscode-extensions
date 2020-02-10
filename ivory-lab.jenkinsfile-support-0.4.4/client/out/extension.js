'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode_1 = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
let client;
function activate(context) {
    let serverModule = context.asAbsolutePath(path.join('server', 'out', 'server.js'));
    client = new vscode_languageclient_1.LanguageClient('lsp-client', 'Jenkinsfile lsp client', getServerOptions(serverModule), getClientOptions());
    client.start();
}
exports.activate = activate;
function getDebugOptions() {
    return {
        execArgv: ['--nolazy', '--inspect=6009']
    };
}
exports.getDebugOptions = getDebugOptions;
function getServerOptions(serverModule) {
    let debugOptions = getDebugOptions();
    return {
        run: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: vscode_languageclient_1.TransportKind.ipc,
            options: debugOptions
        }
    };
}
exports.getServerOptions = getServerOptions;
function getClientOptions() {
    return {
        documentSelector: [{ scheme: 'file', language: 'jenkinsfile' }],
        synchronize: {
            fileEvents: vscode_1.workspace.createFileSystemWatcher('**/.clientrc')
        }
    };
}
exports.getClientOptions = getClientOptions;
function deactivate() {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map