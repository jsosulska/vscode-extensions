'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
var PuppetInstallType;
(function (PuppetInstallType) {
    PuppetInstallType["PDK"] = "pdk";
    PuppetInstallType["PUPPET"] = "agent";
    PuppetInstallType["AUTO"] = "auto";
})(PuppetInstallType = exports.PuppetInstallType || (exports.PuppetInstallType = {}));
var ProtocolType;
(function (ProtocolType) {
    ProtocolType["UNKNOWN"] = "<unknown>";
    ProtocolType["STDIO"] = "stdio";
    ProtocolType["TCP"] = "tcp";
})(ProtocolType = exports.ProtocolType || (exports.ProtocolType = {}));
var ConnectionType;
(function (ConnectionType) {
    ConnectionType[ConnectionType["Unknown"] = 0] = "Unknown";
    ConnectionType[ConnectionType["Local"] = 1] = "Local";
    ConnectionType[ConnectionType["Remote"] = 2] = "Remote";
})(ConnectionType = exports.ConnectionType || (exports.ConnectionType = {}));
const workspaceSectionName = 'puppet';
/**
 * Safely query the workspace configuration for a nested setting option.  If it, or any part of the setting
 * path does not exist, return undefined
 * @param workspaceConfig The VScode workspace configuration to query
 * @param indexes         An array of strings defining the setting path, e.g. The setting 'a.b.c' would pass indexes of ['a','b','c']
 */
function getSafeWorkspaceConfig(workspaceConfig, indexes) {
    if (indexes.length <= 0) {
        return undefined;
    }
    let index = indexes.shift();
    let result = workspaceConfig[index];
    while (indexes.length > 0 && result !== undefined) {
        index = indexes.shift();
        result = result[index];
    }
    // A null settings is really undefined.
    if (result === null) {
        return undefined;
    }
    return result;
}
/**
 * Retrieves the list of "legacy" or deprecated setting names and their values
 */
function legacySettings() {
    const workspaceConfig = vscode.workspace.getConfiguration(workspaceSectionName);
    let settings = new Map();
    let value = undefined;
    // puppet.editorService.modulePath
    // value = getSafeWorkspaceConfig(workspaceConfig, ['editorService', 'modulePath']);
    // if (value !== undefined) {
    //   settings.set('puppet.editorService.modulePath', value);
    // }
    return settings;
}
exports.legacySettings = legacySettings;
// Default settings
function DefaultWorkspaceSettings() {
    return {
        editorService: {
            enable: true,
            featureFlags: [],
            loglevel: 'normal',
            protocol: ProtocolType.STDIO,
            timeout: 10
        },
        format: {
            enable: true
        },
        hover: {
            showMetadataInfo: true
        },
        installDirectory: undefined,
        installType: PuppetInstallType.AUTO,
        lint: {
            enable: true
        },
        notification: {
            nodeGraph: 'messagebox',
            puppetResource: 'messagebox'
        },
        pdk: {
            checkVersion: true
        }
    };
}
exports.DefaultWorkspaceSettings = DefaultWorkspaceSettings;
function SettingsFromWorkspace() {
    const workspaceConfig = vscode.workspace.getConfiguration(workspaceSectionName);
    const defaults = DefaultWorkspaceSettings();
    // TODO: What if the wrong type is passed through? will it blow up?
    let settings = {
        editorService: workspaceConfig.get('editorService', defaults.editorService),
        format: workspaceConfig.get('format', defaults.format),
        hover: workspaceConfig.get('hover', defaults.hover),
        installDirectory: workspaceConfig.get('installDirectory', defaults.installDirectory),
        installType: workspaceConfig.get('installType', defaults.installType),
        lint: workspaceConfig.get('lint', defaults.lint),
        notification: workspaceConfig.get('notification', defaults.notification),
        pdk: workspaceConfig.get('pdk', defaults.pdk)
    };
    /**
     * Legacy Workspace Settings
     *
     * Retrieve deprecated settings and apply them to the settings.  This is only needed as a helper and should be
     * removed a version or two later, after the setting is deprecated.
     */
    // Ensure that object types needed for legacy settings exists
    if (settings.editorService === undefined) {
        settings.editorService = {};
    }
    if (settings.editorService.featureFlags === undefined) {
        settings.editorService.featureFlags = [];
    }
    if (settings.editorService.puppet === undefined) {
        settings.editorService.puppet = {};
    }
    if (settings.editorService.tcp === undefined) {
        settings.editorService.tcp = {};
    }
    // Retrieve the legacy settings
    const oldSettings = legacySettings();
    // Translate the legacy settings into the new setting names
    for (const [settingName, value] of oldSettings) {
        switch (settingName) {
            // case 'puppet.puppetAgentDir': // --> puppet.installDirectory
            //   settings.installDirectory = <string>value;
            //   break;
        }
    }
    return settings;
}
exports.SettingsFromWorkspace = SettingsFromWorkspace;
//# sourceMappingURL=settings.js.map