"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const HelmChannel = "Helm";
// HelmConsole provides a log-like facility for sending messages to the Helm output channel.
//
// A console is disposable, since it allocates a channel.
class HelmConsole {
    constructor(chanName) {
        this.chan = vscode.window.createOutputChannel(chanName);
    }
    log(msg) {
        this.chan.append(msg);
        this.chan.append("\n");
        this.chan.show();
    }
    dispose() {
        this.chan.dispose();
    }
}
// Create a single shared logger.
exports.logger = new HelmConsole(HelmChannel);
//# sourceMappingURL=logger.js.map