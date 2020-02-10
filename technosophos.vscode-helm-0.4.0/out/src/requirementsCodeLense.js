"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class RequirementsCodeLenseProvider {
    provideCodeLenses(doc, tok) {
        if (!doc.fileName.endsWith("requirements.yaml")) {
            return;
        }
        // Find the dependencies section
        let i = doc.getText().indexOf("dependencies:");
        let start = doc.positionAt(i);
        let range = doc.getWordRangeAtPosition(start);
        if (range.isEmpty) {
            return;
        }
        let update = new vscode.CodeLens(range, {
            title: "update dependencies",
            command: "extension.helmDepUp"
        });
        let insert = new vscode.CodeLens(range, {
            title: "insert dependency",
            command: "extension.helmInsertReq",
        });
        return [update, insert];
    }
}
exports.RequirementsCodeLenseProvider = RequirementsCodeLenseProvider;
//# sourceMappingURL=requirementsCodeLense.js.map