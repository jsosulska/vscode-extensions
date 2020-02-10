"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const vscode_extension_telemetry_1 = require("vscode-extension-telemetry");
exports.reporter = getTelemetryReporter();
function getTelemetryReporter() {
    let pkg = getPackageInfo();
    let reporter = new vscode_extension_telemetry_1.default(pkg.name, pkg.version, pkg.aiKey);
    return reporter;
}
function getPackageInfo() {
    let pkg = vscode.extensions.getExtension('jpogran.puppet-vscode');
    return {
        name: pkg.packageJSON.name,
        version: pkg.packageJSON.version,
        aiKey: pkg.packageJSON.aiKey
    };
}
//# sourceMappingURL=telemetry.js.map