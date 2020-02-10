"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const funcmap_1 = require("./funcmap");
const logger_1 = require("./logger");
const YAML = require("yamljs");
const exec = require("./exec");
const path = require("path");
const _ = require("lodash");
const fs_1 = require("fs");
class HelmTemplateCompletionProvider {
    constructor() {
        this.valuesMatcher = new RegExp('\\s+\\.Values\\.([a-zA-Z0-9\\._-]+)?$');
        this.funcmap = new funcmap_1.FuncMap();
        this.refreshValues();
    }
    refreshValues() {
        let ed = vscode.window.activeTextEditor;
        if (!ed) {
            return;
        }
        let self = this;
        exec.pickChartForFile(ed.document.fileName, f => {
            let valsYaml = path.join(f, "values.yaml");
            if (!fs_1.existsSync(valsYaml)) {
                return;
            }
            try {
                self.valuesCache = YAML.load(valsYaml);
            }
            catch (err) {
                logger_1.logger.log(err.message);
                return;
            }
        });
    }
    provideCompletionItems(doc, pos) {
        // If the preceding character is a '.', we kick it into dot resolution mode.
        // Otherwise, we go with function completion.
        let wordPos = doc.getWordRangeAtPosition(pos);
        let word = doc.getText(wordPos);
        let line = doc.lineAt(pos.line).text;
        let lineUntil = line.substr(0, wordPos.start.character);
        //logger.log(lineUntil)
        if (lineUntil.endsWith(".")) {
            //logger.log("sending to dotCompletionItems ")
            return this.dotCompletionItems(doc, pos, word, lineUntil);
        }
        return new vscode.CompletionList((new funcmap_1.FuncMap).all());
    }
    dotCompletionItems(doc, pos, word, lineUntil) {
        if (lineUntil.endsWith(" .")) {
            return this.funcmap.helmVals();
        }
        else if (lineUntil.endsWith(".Release.")) {
            return this.funcmap.releaseVals();
        }
        else if (lineUntil.endsWith(".Chart.")) {
            return this.funcmap.chartVals();
        }
        else if (lineUntil.endsWith(".Files.")) {
            return this.funcmap.filesVals();
        }
        else if (lineUntil.endsWith(".Capabilities.")) {
            return this.funcmap.capabilitiesVals();
        }
        else if (lineUntil.endsWith(".Values.")) {
            if (!_.isPlainObject(this.valuesCache)) {
                return;
            }
            let keys = _.keys(this.valuesCache);
            let res = [];
            keys.forEach(key => {
                res.push(this.funcmap.v(key, ".Values." + key, "In values.yaml: " + this.valuesCache[key]));
            });
            return res;
        }
        else {
            // If we get here, we inspect the string to see if we are at some point in a
            // .Values.SOMETHING. expansion. We recurse through the values file to see
            // if there are any autocomplete options there.
            let res;
            try {
                res = this.valuesMatcher.exec(lineUntil);
            }
            catch (err) {
                logger_1.logger.log(err.message);
                return [];
            }
            // If this does not match the valuesMatcher (Not a .Values.SOMETHING...) then
            // we return right away.
            if (!res || res.length == 0) {
                return [];
            }
            //logger.log("Match: " + res[0] + " ('"+res[1]+"' matches)")
            if (res[1].length == 0) {
                // This is probably impossible. It would match '.Values.', but that is
                // matched by a previous condition.
                return [];
            }
            // If we get here, we've got .Values.SOMETHING..., and we want to walk that
            // tree to see what suggestions we can give based on the contents of the
            // current values.yaml file.
            let parts = res[1].split(".");
            let words = [];
            var cache = this.valuesCache;
            for (var i = 0; i < parts.length; ++i) {
                let cur = parts[i];
                if (cur.length == 0) {
                    // We hit the trailing dot.
                    break;
                }
                if (!cache[cur]) {
                    // The key does not exist. User has typed something not in values.yaml
                    return [];
                }
                cache = cache[cur];
            }
            if (!cache) {
                //logger.log("Found no matches for " + res[1])
                return [];
            }
            let k = [];
            _.keys(cache).forEach(item => {
                // Build help text for each suggestion we found.
                k.push(this.v(item, res[0] + item, "In values.yaml: " + cache[item]));
            });
            return k;
        }
    }
    v(name, use, doc) {
        let i = new vscode.CompletionItem(name, vscode.CompletionItemKind.Constant);
        i.detail = use;
        i.documentation = doc;
        return i;
    }
    f(name, args, doc) {
        let i = new vscode.CompletionItem(name, vscode.CompletionItemKind.Function);
        i.detail = args;
        i.documentation = doc;
        return i;
    }
    withValues(fn) {
        let doc = vscode.window.activeTextEditor.document;
        exec.pickChartForFile(doc.fileName, f => {
            let valsYaml = path.join(f, "values.yaml");
            var vals;
            try {
                vals = YAML.load(valsYaml);
            }
            catch (err) {
                logger_1.logger.log(err.message);
                fn({});
            }
            fn(vals);
        });
    }
}
exports.HelmTemplateCompletionProvider = HelmTemplateCompletionProvider;
//# sourceMappingURL=completionProvider.js.map