"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const shell = require("shelljs");
const path = require("path");
const logger_1 = require("./logger");
/*
 * This file contains experimental support for Draft.
 */
function draftVersion() {
    draftExec("version", function (code, out, err) {
        if (code != 0) {
            vscode.window.showErrorMessage(err);
            return;
        }
        vscode.window.showInformationMessage(out);
    });
}
exports.draftVersion = draftVersion;
function draftExec(args, fn) {
    if (!shell.which("draft")) {
        vscode.window.showErrorMessage("Install Draft on your executable path");
        return;
    }
    let cmd = "draft " + args;
    shell.exec(cmd, fn);
}
exports.draftExec = draftExec;
function draftCreate() {
    // This is a lame hack because draft does not take a path argument.
    //shell.cd(vscode.workspace.rootPath)
    vscode.window.showInputBox({ prompt: "Project Name", placeHolder: "helloWorld" }).then(name => {
        let cmd = "create -a " + name + " " + vscode.workspace.rootPath;
        draftExec(cmd, (code, out, err) => {
            if (code != 0) {
                vscode.window.showErrorMessage(err);
                return;
            }
            vscode.window.showInformationMessage("Created " + name);
        });
    });
}
exports.draftCreate = draftCreate;
function draftCreateManual() {
    // This is a lame hack because draft does not take a path argument.
    //shell.cd(vscode.workspace.rootPath)
    vscode.window.showInputBox({ prompt: "Project Name", placeHolder: "helloWorld" }).then(name => {
        selectPack(pack => {
            let cmd = "create -p " + pack + " -a " + name + " " + vscode.workspace.rootPath;
            console.log(cmd);
            draftExec(cmd, (code, out, err) => {
                if (code != 0) {
                    vscode.window.showErrorMessage(err);
                    return;
                }
                vscode.window.showInformationMessage("Created " + name);
            });
        });
    });
}
exports.draftCreateManual = draftCreateManual;
function draftUp() {
    logger_1.logger.log("===== Starting new Draft build ======");
    if (!shell.which("draft")) {
        vscode.window.showErrorMessage("Install Draft on your executable path");
        return;
    }
    let cmd = "draft up " + vscode.workspace.rootPath;
    let proc = shell.exec(cmd, { async: true }, (code) => {
        if (code != 0) {
            logger_1.logger.log("ERROR: draft up exited with code " + code);
        }
        logger_1.logger.log("===== Draft build is complete =====");
    });
    proc.stdout.on('data', data => { logger_1.logger.log(data); });
    proc.stderr.on('data', data => { logger_1.logger.log(data); });
}
exports.draftUp = draftUp;
function selectPack(fn) {
    draftExec("home", (code, out, err) => {
        if (code != 0) {
            vscode.window.showErrorMessage(err);
            return;
        }
        let dir = path.join(out.slice(0, -1), "packs");
        let dirs = shell.ls(dir);
        vscode.window.showQuickPick(dirs).then(val => {
            fn(val);
        });
    });
}
//# sourceMappingURL=draft.js.map