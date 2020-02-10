"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const funcmap_1 = require("./funcmap");
const resources_1 = require("./resources");
// Provide hover support
class HelmTemplateHoverProvider {
    constructor() {
        let fm = new funcmap_1.FuncMap();
        let rs = new resources_1.Resources();
        this.funcmap = fm.all();
        this.valmap = fm.helmVals();
        this.resmap = rs.all();
    }
    provideHover(doc, pos, tok) {
        let wordRange = doc.getWordRangeAtPosition(pos);
        let word = wordRange ? doc.getText(wordRange) : "";
        if (word == "") {
            return Promise.resolve(null);
        }
        // FIXME: right now, the line `foo: {{foo}}` may match both the action and the resource def
        if (this.inActionVal(doc, pos, word)) {
            let found = this.findVal(word);
            if (found) {
                return new vscode.Hover(found, wordRange);
            }
        }
        if (this.inAction(doc, pos, word)) {
            let found = this.findFunc(word);
            if (found) {
                return new vscode.Hover(found, wordRange);
            }
        }
        if (this.notInAction(doc, pos, word)) {
            let found = this.findResourceDef(word);
            if (found) {
                return new vscode.Hover(found, wordRange);
            }
        }
        return Promise.resolve(null);
    }
    inAction(doc, pos, word) {
        let lineText = doc.lineAt(pos.line).text;
        let r = new RegExp("{{[^}]*[\\s\\(|]?(" + word + ")\\s[^{]*}}");
        return r.test(lineText);
    }
    notInAction(doc, pos, word) {
        let lineText = doc.lineAt(pos.line).text;
        let r = new RegExp("(^|})[^{]*(" + word + ")");
        return r.test(lineText);
    }
    findFunc(word) {
        for (var i = 0; i < this.funcmap.length; i++) {
            let item = this.funcmap[i];
            if (item.label == word) {
                return [{ language: "helm", value: `{{ ${item.detail} }}` }, `${item.documentation}`];
            }
        }
    }
    inActionVal(doc, pos, word) {
        let lineText = doc.lineAt(pos.line).text;
        let r = new RegExp("{{[^}]*\\.(" + word + ")[\\.\\s]?[^{]*}}");
        return r.test(lineText);
    }
    findVal(word) {
        for (var i = 0; i < this.valmap.length; i++) {
            let item = this.valmap[i];
            if (item.label == word) {
                return [{ language: "helm", value: `{{ ${item.detail} }}` }, `${item.documentation}`];
            }
        }
    }
    findResourceDef(word) {
        for (var i = 0; i < this.resmap.length; i++) {
            let item = this.resmap[i];
            if (item.label == word) {
                return [{ language: "helm", value: `${item.detail}` }, `${item.documentation}`];
            }
        }
    }
}
exports.HelmTemplateHoverProvider = HelmTemplateHoverProvider;
//# sourceMappingURL=hoverProvider.js.map