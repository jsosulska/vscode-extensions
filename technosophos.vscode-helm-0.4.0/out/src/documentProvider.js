"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const filepath = require("path");
const exec = require("./exec");
const YAML = require("yamljs");
const fs = require("fs");
const logger_1 = require("./logger");
function previewBody(title, data, err) {
    return `<body>
      <h1>${title}</h1>
      <pre>${data}</pre>
    </body>`;
}
class HelmInspectDocumentProvider {
    provideTextDocumentContent(uri, tok) {
        return new Promise((resolve, reject) => {
            console.log("provideTextDocumentContent called with uri " + uri.toString());
            let printer = (code, out, err) => {
                if (code == 0) {
                    let p = (filepath.extname(uri.fsPath) == ".tgz") ? filepath.basename(uri.fsPath) : "Chart";
                    let title = "Inspect " + p;
                    resolve(previewBody(title, out));
                }
                reject(err);
            };
            let file = uri.fsPath;
            let fi = fs.statSync(file);
            if (!fi.isDirectory() && filepath.extname(file) == ".tgz") {
                exec.helmExec("inspect values " + file, printer);
                return;
            }
            else if (fi.isDirectory() && fs.existsSync(filepath.join(file, "Chart.yaml"))) {
                exec.helmExec("inpsect values " + file, printer);
                return;
            }
            exec.pickChartForFile(file, path => {
                exec.helmExec("inspect values " + path, printer);
            });
        });
    }
}
exports.HelmInspectDocumentProvider = HelmInspectDocumentProvider;
// Provide an HTML-formatted preview window.
class HelmTemplatePreviewDocumentProvider {
    constructor() {
        this._onDidChange = new vscode.EventEmitter();
    }
    get onDidChange() {
        return this._onDidChange.event;
    }
    update(uri) {
        this._onDidChange.fire(uri);
    }
    provideTextDocumentContent(uri, tok) {
        return new Promise((resolve, reject) => {
            // The URI is the encapsulated path to the template to render.
            //let tpl = uri.fsPath
            if (!vscode.window.activeTextEditor) {
                logger_1.logger.log("FIXME: no editor selected");
                return;
            }
            let tpl = vscode.window.activeTextEditor.document.fileName;
            // First, we need to get the top-most chart:
            exec.pickChartForFile(tpl, chartPath => {
                // We need the relative path for 'helm template'
                let reltpl = filepath.relative(filepath.dirname(chartPath), tpl);
                exec.helmExec("template " + chartPath + " --execute " + reltpl, (code, out, err) => {
                    if (code != 0) {
                        resolve(previewBody("Chart Preview", "Failed template call." + err, true));
                        return;
                    }
                    if (filepath.basename(reltpl) != "NOTES.txt") {
                        var res;
                        try {
                            res = YAML.parse(out);
                        }
                        catch (e) {
                            // TODO: Figure out the best way to display this message, but have it go away when the
                            // file parses correctly.
                            //resolve(previewBody("Chart Preview", "Invalid YAML: " + err.message, true))
                            vscode.window.showErrorMessage(`YAML failed to parse: ${e.message}`);
                        }
                    }
                    resolve(previewBody(reltpl, out));
                });
            });
        });
    }
}
exports.HelmTemplatePreviewDocumentProvider = HelmTemplatePreviewDocumentProvider;
//# sourceMappingURL=documentProvider.js.map