"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const shell = require("shelljs");
const filepath = require("path");
const logger_1 = require("./logger");
const YAML = require("yamljs");
const _ = require("lodash");
exports.HELM_PREVIEW_SCHEME = 'helm-template-preview';
exports.HELM_PREVIEW_URI = exports.HELM_PREVIEW_SCHEME + '://preview';
// This file contains utilities for executing command line tools, notably Helm.
function helmVersion() {
    helmExec("version -c", function (code, out, err) {
        if (code != 0) {
            vscode.window.showErrorMessage(err);
            return;
        }
        vscode.window.showInformationMessage(out);
    });
}
exports.helmVersion = helmVersion;
// Run a 'helm template' command.
// This looks for Chart.yaml files in the present project. If only one is found, it
// runs 'helm template' on it. If multiples are found, it prompts the user to select one.
function helmTemplate() {
    pickChart(path => {
        helmExec("template " + path, (code, out, err) => {
            if (code != 0) {
                vscode.window.showErrorMessage(err);
                return;
            }
            vscode.window.showInformationMessage("chart rendered successfully");
            logger_1.logger.log(out);
        });
    });
}
exports.helmTemplate = helmTemplate;
function helmTemplatePreview() {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage("No active editor.");
        return;
    }
    let filePath = editor.document.fileName;
    if (filePath.indexOf("templates") < 0) {
        vscode.window.showInformationMessage("Not a template: " + filePath);
        return;
    }
    let u = vscode.Uri.parse(exports.HELM_PREVIEW_URI);
    let f = filepath.basename(filePath);
    vscode.commands.executeCommand("vscode.previewHtml", u, vscode.ViewColumn.Two, `Preview ${f}`);
}
exports.helmTemplatePreview = helmTemplatePreview;
function helmDepUp() {
    pickChart(path => {
        logger_1.logger.log("⎈⎈⎈ Updating dependencies for " + path);
        helmExec("dep up " + path, (code, out, err) => {
            logger_1.logger.log(out);
            logger_1.logger.log(err);
            if (code != 0) {
                logger_1.logger.log("⎈⎈⎈ UPDATE FAILED");
            }
        });
    });
}
exports.helmDepUp = helmDepUp;
function helmCreate() {
    vscode.window.showInputBox({
        prompt: "chart name",
        placeHolder: "mychart"
    }).then(name => {
        let fullpath = filepath.join(vscode.workspace.rootPath, name);
        helmExec("create " + fullpath, (code, out, err) => {
            if (code != 0) {
                vscode.window.showErrorMessage(err);
            }
        });
    });
}
exports.helmCreate = helmCreate;
// helmLint runs the Helm linter on a chart within your project.
function helmLint() {
    pickChart(path => {
        logger_1.logger.log("⎈⎈⎈ Linting " + path);
        helmExec("lint " + path, (code, out, err) => {
            logger_1.logger.log(out);
            logger_1.logger.log(err);
            if (code != 0) {
                logger_1.logger.log("⎈⎈⎈ LINTING FAILED");
            }
        });
    });
}
exports.helmLint = helmLint;
// helmInspect inspects a packaged chart or a chart dir and returns the values.
// If a non-tgz, non-directory file is passed, this tries to find a parent chart.
function helmInspectValues(u) {
    let uri = vscode.Uri.parse("helm-inspect-values://" + u.fsPath);
    vscode.commands.executeCommand("vscode.previewHtml", uri, vscode.ViewColumn.Two, "Inspect");
}
exports.helmInspectValues = helmInspectValues;
// helmDryRun runs a helm install with --dry-run and --debug set.
function helmDryRun() {
    pickChart(path => {
        logger_1.logger.log("⎈⎈⎈ Installing (dry-run) " + path);
        helmExec("install --dry-run --debug " + path, (code, out, err) => {
            logger_1.logger.log(out);
            logger_1.logger.log(err);
            if (code != 0) {
                logger_1.logger.log("⎈⎈⎈ INSTALL FAILED");
            }
        });
    });
}
exports.helmDryRun = helmDryRun;
// pickChart tries to find charts in this repo. If one is found, fn() is executed with that
// chart's path. If more than one are found, the user is prompted to choose one, and then
// the fn is executed with that chart.
//
// callback is fn(path)
function pickChart(fn) {
    vscode.workspace.findFiles("**/Chart.yaml", "", 1024).then(matches => {
        switch (matches.length) {
            case 0:
                vscode.window.showErrorMessage("No charts found");
                return;
            case 1:
                // Assume that if there is only one chart, that's the one to run.
                let p = filepath.dirname(matches[0].fsPath);
                fn(p);
                return;
            default:
                var paths = [];
                // TODO: This would be so much cooler if the QuickPick parsed the Chart.yaml
                // and showed the chart name instead of the path.
                matches.forEach(item => {
                    paths.push(filepath.relative(vscode.workspace.rootPath, filepath.dirname(item.fsPath)) || ".");
                });
                vscode.window.showQuickPick(paths).then(picked => {
                    fn(filepath.join(vscode.workspace.rootPath, picked));
                });
                return;
        }
    });
}
exports.pickChart = pickChart;
class Chart {
}
// Load a chart object
function loadChartMetadata(chartDir) {
    let f = filepath.join(chartDir, "Chart.yaml");
    var c;
    try {
        c = YAML.load(f);
    }
    catch (err) {
        vscode.window.showErrorMessage("Chart.yaml: " + err);
    }
    return c;
}
exports.loadChartMetadata = loadChartMetadata;
// Given a file, show any charts that this file belongs to.
function pickChartForFile(file, fn) {
    vscode.workspace.findFiles("**/Chart.yaml", "", 1024).then(matches => {
        //logger.log(`Found ${ matches.length } charts`)
        switch (matches.length) {
            case 0:
                vscode.window.showErrorMessage("No charts found");
                return;
            case 1:
                // Assume that if there is only one chart, that's the one to run.
                let p = filepath.dirname(matches[0].fsPath);
                fn(p);
                return;
            default:
                var paths = [];
                matches.forEach(item => {
                    let dirname = filepath.dirname(item.fsPath);
                    let rel = filepath.relative(dirname, file);
                    // If the present file is not in a subdirectory of the parent chart, skip the chart.
                    if (rel.indexOf("..") >= 0) {
                        return;
                    }
                    paths.push(filepath.relative(vscode.workspace.rootPath, filepath.dirname(item.fsPath)));
                });
                if (paths.length == 0) {
                    vscode.window.showErrorMessage("Chart not found for " + file);
                    return;
                }
                // For now, let's go with the top-most path (umbrella chart)
                if (paths.length >= 1) {
                    fn(filepath.join(vscode.workspace.rootPath, paths[0]));
                    return;
                }
                return;
        }
    });
}
exports.pickChartForFile = pickChartForFile;
// helmExec appends 'args' to a Helm command (helm args...), executes it, and then sends the result to te callback.
// fn should take the signature function(code, stdout, stderr)
//
// This will abort and send an error message if Helm is not installed.
function helmExec(args, fn) {
    try {
        ensureHelm();
    }
    catch (e) {
        vscode.window.showErrorMessage("You must install Helm on your executable path");
        return;
    }
    let cmd = "helm " + args;
    shell.exec(cmd, fn);
}
exports.helmExec = helmExec;
// isHelmChart tests whether the given path has a Chart.yaml file
function isHelmChart(path) {
    return shell.test("-e", path + "/Chart.yaml");
}
exports.isHelmChart = isHelmChart;
function ensureHelm() {
    if (!shell.which("helm")) {
        throw "helm not installed";
    }
}
exports.ensureHelm = ensureHelm;
class Requirement {
    toString() {
        return `- name: ${this.name}
  version: ${this.version}
  repository: ${this.repository}
`;
    }
}
exports.Requirement = Requirement;
function insertRequirement() {
    vscode.window.showInputBox({
        prompt: "Chart",
        placeHolder: "stable/redis",
    }).then(val => {
        let req = searchForChart(val);
        if (!req) {
            vscode.window.showErrorMessage(`Chart ${val} not found`);
            return;
        }
        let ed = vscode.window.activeTextEditor;
        if (!ed) {
            logger_1.logger.log(YAML.stringify(req));
            return;
        }
        ed.insertSnippet(new vscode.SnippetString(req.toString()));
    });
}
exports.insertRequirement = insertRequirement;
// searchForChart takes a 'repo/name' and returns an entry suitable for requirements
function searchForChart(name, version) {
    let parts = name.split("/", 2);
    if (parts.length != 2) {
        logger_1.logger.log("Chart should be of the form REPO/CHARTNAME");
        return;
    }
    let hh = helmHome();
    let reposFile = filepath.join(hh, "repository", "repositories.yaml");
    let repos = YAML.load(reposFile);
    var req;
    repos.repositories.forEach(repo => {
        //logger.log("repo: " + repo.name)
        if (repo.name == parts[0]) {
            //let cache = YAML.load(filepath.join(hh, "repository", "cache", repo.cache))
            let cache = YAML.load(repo.cache);
            _.each(cache.entries, (releases, name) => {
                //logger.log("entry: " + name)
                if (name == parts[1]) {
                    req = new Requirement();
                    req.repository = repo.url;
                    req.name = name;
                    req.version = releases[0].version;
                    return;
                }
            });
            return;
        }
    });
    return req;
}
exports.searchForChart = searchForChart;
function helmHome() {
    let h = process.env.HOME;
    return process.env["HELM_HOME"] || filepath.join(h, '.helm');
}
exports.helmHome = helmHome;
//# sourceMappingURL=exec.js.map