'use strict';
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
const vscode = require("vscode");
const path = require("path");
const interfaces_1 = require("../interfaces");
const messages_1 = require("../messages");
const telemetry_1 = require("../telemetry");
const viz = require("viz.js");
const settings_1 = require("../settings");
const PuppetNodeGraphToTheSideCommandId = 'extension.puppetShowNodeGraphToSide';
class NodeGraphWebViewProvider {
    constructor(documentUri, connectionManager, parent) {
        this.connectionHandler = undefined;
        this.docUri = undefined;
        this.webPanel = undefined;
        this.parentFeature = undefined;
        this.shownLanguageServerNotAvailable = false;
        this.docUri = documentUri;
        this.connectionHandler = connectionManager;
        this.parentFeature = parent;
    }
    isSameUri(value) {
        return value.toString() === this.docUri.toString();
    }
    show() {
        if (this.webPanel !== undefined) {
            return;
        }
        this.webPanel = vscode.window.createWebviewPanel('nodeGraph', // Identifies the type of the webview. Used internally
        `Node Graph '${path.basename(this.docUri.fsPath)}'`, // Title of the panel displayed to the user
        vscode.ViewColumn.Beside, // Editor column to show the new webview panel in.
        { enableScripts: true });
        this.webPanel.onDidDispose(() => {
            this.parentFeature.onProviderWebPanelDisposed(this);
        });
        this.webPanel.webview.html = "Generating...";
        this.updateAsync();
    }
    updateAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            this.webPanel.webview.html = yield this.getHTMLContent();
        });
    }
    getHTMLContent() {
        return __awaiter(this, void 0, void 0, function* () {
            if ((this.connectionHandler.status !== interfaces_1.ConnectionStatus.RunningLoaded) && (this.connectionHandler.status !== interfaces_1.ConnectionStatus.RunningLoading)) {
                if (this.shownLanguageServerNotAvailable) {
                    vscode.window.showInformationMessage("The Puppet Node Graph Preview is not available as the Editor Service is not ready");
                    this.shownLanguageServerNotAvailable = true;
                }
                return "The Puppet Node Graph Preview is not available as the Editor Service is not ready";
            }
            // Use the language server to render the document
            const requestData = {
                external: this.docUri.toString()
            };
            // Calculate where the progress message should go, if at all.
            const currentSettings = settings_1.SettingsFromWorkspace();
            var notificationType = vscode.ProgressLocation.Notification;
            if (currentSettings.notification !== undefined && currentSettings.notification.nodeGraph !== undefined) {
                switch (currentSettings.notification.nodeGraph.toLowerCase()) {
                    case "messagebox":
                        notificationType = vscode.ProgressLocation.Notification;
                        break;
                    case "statusbar":
                        notificationType = vscode.ProgressLocation.Window;
                        break;
                    case "none":
                        notificationType = undefined;
                        break;
                    default: break; // Default is already set
                }
            }
            if (notificationType !== undefined) {
                return vscode.window.withProgress({
                    location: notificationType,
                    title: "Puppet",
                    cancellable: false
                }, (progress) => {
                    progress.report({ message: "Generating Node Graph" });
                    return this.connectionHandler.languageClient
                        .sendRequest(messages_1.CompileNodeGraphRequest.type, requestData)
                        .then((compileResult) => {
                        return this.responseToHTMLString(compileResult);
                    });
                });
            }
            else {
                return this.connectionHandler.languageClient
                    .sendRequest(messages_1.CompileNodeGraphRequest.type, requestData)
                    .then((compileResult) => {
                    return this.responseToHTMLString(compileResult);
                });
            }
        });
    }
    responseToHTMLString(compileResult) {
        var svgContent = '';
        if (compileResult.dotContent !== null) {
            var styling = `
      bgcolor = "transparent"
      color = "white"
      rankdir = "TB"
      node [ shape="box" penwidth="2" color="#e0e0e0" style="rounded,filled" fontname="Courier New" fillcolor=black, fontcolor="white"]
      edge [ style="bold" color="#f0f0f0" penwith="2" ]

      label = ""`;
            var graphContent = compileResult.dotContent;
            if (graphContent === undefined) {
                graphContent = '';
            }
            // vis.jz sees backslashes as escape characters, however they are not in the DOT language.  Instead
            // we should escape any backslash coming from a valid DOT file in preparation to be rendered
            graphContent = graphContent.replace(/\\/g, "\\\\");
            graphContent = graphContent.replace(`label = "editorservices"`, styling);
            svgContent = viz(graphContent, "svg");
        }
        var errorContent = `<div style='font-size: 1.5em'>${compileResult.error}</div>`;
        if ((compileResult.error === undefined) || (compileResult.error === null)) {
            errorContent = '';
        }
        if (telemetry_1.reporter) {
            telemetry_1.reporter.sendTelemetryEvent(PuppetNodeGraphToTheSideCommandId);
        }
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    g.node path {
      fill: var(--vscode-button-background);
      stroke: var(--vscode-button-hoverBackground);
    }
    g.node text {
      fill: var(--vscode-button-foreground);
    }
    g.edge path {
      fill: none;
      stroke: var(--vscode-foreground);
    }
    g.edge polygon {
      fill: var(--vscode-foreground);
      stroke: var(--vscode-foreground);
    }
  </style>
</head>
<body>
${errorContent}
<div id="graphviz_svg_div">
${svgContent}
</div>
</body></html>`;
        return html;
    }
    dispose() {
        this.webPanel.dispose();
        return undefined;
    }
}
class NodeGraphFeature {
    constructor(langID, connectionHandler, logger, context) {
        this.acceptedLangId = undefined;
        this.providers = undefined;
        this.connectionHandler = undefined;
        this.acceptedLangId = langID;
        this.providers = [];
        this.connectionHandler = connectionHandler;
        context.subscriptions.push(vscode.commands.registerCommand(PuppetNodeGraphToTheSideCommandId, () => {
            if (!vscode.window.activeTextEditor) {
                return;
            }
            if (vscode.window.activeTextEditor.document.languageId !== this.acceptedLangId) {
                return;
            }
            let resource = vscode.window.activeTextEditor.document.uri;
            let provider = new NodeGraphWebViewProvider(resource, this.connectionHandler, this);
            this.providers.push(provider);
            provider.show();
        }));
        logger.debug("Registered " + PuppetNodeGraphToTheSideCommandId + " command");
        // Subscribe to save events and fire updates
        context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(document => {
            this.providers.forEach((item) => {
                if (item.isSameUri(document.uri)) {
                    item.updateAsync();
                }
            });
        }));
        logger.debug("Registered onDidSaveTextDocument for node graph event handler");
    }
    onProviderWebPanelDisposed(provider) {
        // If the panel gets disposed then the user closed the tab.
        // Remove the provider object and dispose of it.
        const index = this.providers.indexOf(provider, 0);
        if (index > -1) {
            this.providers.splice(index, 1);
            provider.dispose();
        }
    }
    dispose() {
        // Dispose of any providers and then clear any references to them
        this.providers.forEach((item) => { item.dispose(); });
        this.providers = [];
        return undefined;
    }
}
exports.NodeGraphFeature = NodeGraphFeature;
//# sourceMappingURL=NodeGraphFeature.js.map