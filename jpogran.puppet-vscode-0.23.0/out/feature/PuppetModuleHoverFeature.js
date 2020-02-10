"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const jsonc_parser_1 = require("jsonc-parser");
class PuppetModuleHoverFeature {
    constructor(context, logger) {
        this.context = context;
        this.logger = logger;
        let selector = [{ language: 'json', scheme: '*', pattern: '**/metadata.json' }];
        context.subscriptions.push(vscode.languages.registerHoverProvider(selector, new PuppetModuleHoverProvider(logger)));
    }
    dispose() { }
}
exports.PuppetModuleHoverFeature = PuppetModuleHoverFeature;
class PuppetModuleHoverProvider {
    constructor(logger) {
        this.logger = logger;
    }
    provideHover(document, position, token) {
        const offset = document.offsetAt(position);
        const location = jsonc_parser_1.getLocation(document.getText(), offset);
        if (location.isAtPropertyKey) {
            return;
        }
        if (location.path[0] !== 'dependencies') {
            return;
        }
        if (location.path[2] !== 'name') {
            return;
        }
        const range = document.getWordRangeAtPosition(position);
        const word = document.getText(range);
        this.logger.debug('Metadata hover info found ' + word + ' module');
        let name = word
            .replace('"', '')
            .replace('"', '')
            .replace('/', '-');
        return this.getModuleInfo(name).then(function (result) {
            let msg = [];
            msg.push(`### ${result.slug}`);
            const releaseDate = new Date(result.releases[0].created_at);
            const dateformat = require('dateformat');
            msg.push(`\nLatest version: ${result.releases[0].version} (${dateformat(releaseDate, 'dS mmmm yyyy')})`);
            if (result.endorsement !== null) {
                const endorsementCapitalized = result.endorsement.charAt(0).toUpperCase() + result.endorsement.slice(1);
                msg.push(`\nEndorsement: ${endorsementCapitalized}`);
            }
            msg.push(`\nOwner: ${result.owner.slug}`);
            const forgeUri = `https://forge.puppet.com/${result.owner.username}/${result.name}`;
            msg.push(`\nForge: \[${forgeUri}\](${forgeUri})\n`);
            if (result.homepage_url !== null) {
                msg.push(`\nProject: \[${result.homepage_url}\](${result.homepage_url})\n`);
            }
            let md = msg.join('\n');
            return Promise.resolve(new vscode.Hover(new vscode.MarkdownString(md), range));
        });
    }
    getModuleInfo(name) {
        var options = {
            url: `https://forgeapi.puppet.com/v3/modules/${name}?exclude_fields=readme%20changelog%20license%20reference`
        };
        return new Promise(function (resolve, reject) {
            const request = require('request');
            request.get(options, function (err, resp, body) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(JSON.parse(body));
                }
            });
        });
    }
}
exports.PuppetModuleHoverProvider = PuppetModuleHoverProvider;
//# sourceMappingURL=PuppetModuleHoverFeature.js.map