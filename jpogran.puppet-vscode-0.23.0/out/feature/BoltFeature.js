"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const path = require("path");
const fs = require("fs");
const telemetry_1 = require("../telemetry");
class BoltFeature {
    dispose() { }
    constructor(context) {
        context.subscriptions.push(vscode_1.commands.registerCommand('puppet-bolt.OpenUserConfigFile', () => {
            let userInventoryFile = path.join(process.env['USERPROFILE'] || '~', '.puppetlabs', 'bolt', 'bolt.yaml');
            this.openOrCreateFile(userInventoryFile, `Default bolt config yml not present. Do you want to create it?`, '# This is an empty bolt config file.\n# You can get started quickly by using the built-in bolt snippets');
            if (telemetry_1.reporter) {
                telemetry_1.reporter.sendTelemetryEvent('puppet-bolt.OpenUserConfigFile');
            }
        }));
        context.subscriptions.push(vscode_1.commands.registerCommand('puppet-bolt.OpenUserInventoryFile', () => {
            let userInventoryFile = path.join(process.env['USERPROFILE'] || '~', '.puppetlabs', 'bolt', 'inventory.yaml');
            this.openOrCreateFile(userInventoryFile, `Default bolt inventory yml not present. Do you want to create it?`, '# This is an empty bolt inventory file.\n# You can get started quickly by using the built-in bolt snippets or use bolt to generate an inventory file from PuppetDb');
            if (telemetry_1.reporter) {
                telemetry_1.reporter.sendTelemetryEvent('puppet-bolt.OpenUserInventoryFile');
            }
        }));
    }
    openOrCreateFile(file, message, template) {
        if (!fs.existsSync(file)) {
            vscode_1.window
                .showQuickPick(['yes', 'no'], {
                placeHolder: message,
                canPickMany: false,
                ignoreFocusOut: true
            })
                .then(answer => {
                switch (answer) {
                    case 'no':
                        break;
                    case 'yes':
                        fs.writeFile(file, template, 'utf8', function (err) {
                            vscode_1.window.showErrorMessage(`Error creating file ${file}. Error: ${err.message}`);
                        });
                        vscode_1.commands.executeCommand('vscode.openFolder', vscode_1.Uri.file(file), false);
                }
            });
        }
        else {
            vscode_1.commands.executeCommand('vscode.openFolder', vscode_1.Uri.file(file), false);
        }
    }
}
exports.BoltFeature = BoltFeature;
//# sourceMappingURL=BoltFeature.js.map