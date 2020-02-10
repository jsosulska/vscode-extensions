'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const messages_1 = require("../messages");
const telemetry_1 = require("../telemetry");
class PDKFeature {
    constructor(context, logger) {
        this.terminal = vscode.window.createTerminal('Puppet PDK');
        this.terminal.processId.then(pid => {
            logger.debug('pdk shell started, pid: ' + pid);
        });
        context.subscriptions.push(this.terminal);
        context.subscriptions.push(vscode.commands.registerCommand(messages_1.PDKCommandStrings.PdkNewModuleCommandId, () => {
            this.pdkNewModuleCommand();
        }));
        logger.debug("Registered " + messages_1.PDKCommandStrings.PdkNewModuleCommandId + " command");
        context.subscriptions.push(vscode.commands.registerCommand(messages_1.PDKCommandStrings.PdkNewClassCommandId, () => {
            this.pdkNewClassCommand();
        }));
        logger.debug("Registered " + messages_1.PDKCommandStrings.PdkNewClassCommandId + " command");
        context.subscriptions.push(vscode.commands.registerCommand(messages_1.PDKCommandStrings.PdkNewTaskCommandId, () => {
            this.pdkNewTaskCommand();
        }));
        logger.debug("Registered " + messages_1.PDKCommandStrings.PdkNewTaskCommandId + " command");
        context.subscriptions.push(vscode.commands.registerCommand(messages_1.PDKCommandStrings.PdkValidateCommandId, () => {
            this.pdkValidateCommand();
        }));
        logger.debug("Registered " + messages_1.PDKCommandStrings.PdkValidateCommandId + " command");
        context.subscriptions.push(vscode.commands.registerCommand(messages_1.PDKCommandStrings.PdkTestUnitCommandId, () => {
            this.pdkTestUnitCommand();
        }));
        logger.debug("Registered " + messages_1.PDKCommandStrings.PdkTestUnitCommandId + " command");
    }
    dispose() {
        this.terminal.dispose();
    }
    pdkNewModuleCommand() {
        let nameOpts = {
            placeHolder: 'Enter a name for the new Puppet module',
            matchOnDescription: true,
            matchOnDetail: true
        };
        let dirOpts = {
            placeHolder: 'Enter a path for the new Puppet module',
            matchOnDescription: true,
            matchOnDetail: true
        };
        vscode.window.showInputBox(nameOpts).then(moduleName => {
            if (moduleName === undefined) {
                vscode.window.showWarningMessage('No module name specifed. Exiting.');
                return;
            }
            vscode.window.showInputBox(dirOpts).then(dir => {
                this.terminal.sendText(`pdk new module --skip-interview ${moduleName} ${dir}`);
                this.terminal.sendText(`code ${dir}`);
                this.terminal.show();
                if (telemetry_1.reporter) {
                    telemetry_1.reporter.sendTelemetryEvent(messages_1.PDKCommandStrings.PdkNewModuleCommandId);
                }
            });
        });
    }
    pdkNewClassCommand() {
        let nameOpts = {
            placeHolder: 'Enter a name for the new Puppet class',
            matchOnDescription: true,
            matchOnDetail: true
        };
        vscode.window.showInputBox(nameOpts).then(moduleName => {
            this.terminal.sendText(`pdk new class ${moduleName}`);
            this.terminal.show();
            if (telemetry_1.reporter) {
                telemetry_1.reporter.sendTelemetryEvent(messages_1.PDKCommandStrings.PdkNewClassCommandId);
            }
        });
    }
    pdkNewTaskCommand() {
        let nameOpts = {
            placeHolder: 'Enter a name for the new Puppet Task',
            matchOnDescription: true,
            matchOnDetail: true
        };
        vscode.window.showInputBox(nameOpts).then(taskName => {
            this.terminal.sendText(`pdk new task ${taskName}`);
            this.terminal.show();
            if (telemetry_1.reporter) {
                telemetry_1.reporter.sendTelemetryEvent(messages_1.PDKCommandStrings.PdkNewTaskCommandId);
            }
        });
    }
    pdkValidateCommand() {
        this.terminal.sendText(`pdk validate`);
        this.terminal.show();
        if (telemetry_1.reporter) {
            telemetry_1.reporter.sendTelemetryEvent(messages_1.PDKCommandStrings.PdkValidateCommandId);
        }
    }
    pdkTestUnitCommand() {
        this.terminal.sendText(`pdk test unit`);
        this.terminal.show();
        if (telemetry_1.reporter) {
            telemetry_1.reporter.sendTelemetryEvent(messages_1.PDKCommandStrings.PdkTestUnitCommandId);
        }
    }
}
exports.PDKFeature = PDKFeature;
//# sourceMappingURL=PDKFeature.js.map