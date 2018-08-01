const Plugin = require("../plugin");

const config = {"info":{"name":"HideIconBadge","authors":[{"name":"Zerebos","discord_id":"249746236008169473","github_username":"rauenzi","twitter_username":"ZackRauen"}],"version":"0.0.3","description":"Hides the badge on the app icon and tray icon. Support Server: bit.ly/ZeresServer","github":"https://github.com/rauenzi/BetterDiscordAddons/tree/master/Plugins/HideIconBadge","github_raw":"https://raw.githubusercontent.com/rauenzi/BetterDiscordAddons/master/Plugins/HideIconBadge/HideIconBadge.plugin.js"},"main":"index.js"};

const EDPlugin = class EDPlugin extends Plugin {
    constructor(ext) {
        super(
            Object.assign({
            name: config.info.name.replace(" ", ""),
            author: config.info.authors.map(a => a.name).join(", "),
            description: config.info.description,
        
            load: function() {if (typeof(this._instantiation.onStart) == "function") this._instantiation.onStart();},
            unload: function() {if (this._instantiation && typeof(this._instantiation.onStop) == "function") this._instantiation.onStop();}
            }, ext)
        );
    }
};
const compilePlugin = ([Plugin, Api]) => {
    const plugin = (Plugin, Api) => {
    const { Patcher, WebpackModules} = Api;
    const ElectronModule = WebpackModules.getByProps(["setBadge"]);
    return class HideIconBadge extends Plugin {
        onStart() {
            ElectronModule.setBadge(0);
            Patcher.before(ElectronModule, "setBadge", (thisObject, methodArguments) => {
                methodArguments[0] = 0;
            });
    
            ElectronModule.setSystemTrayIcon("DEFAULT");
            Patcher.before(ElectronModule, "setSystemTrayIcon", (thisObject, methodArguments) => {
                methodArguments[0] === "UNREAD" ? methodArguments[0] = "DEFAULT" : void 0;
            });
        }
        
        onStop() {
            Patcher.unpatchAll();
        }

    };
};
    return plugin(Plugin, Api);
};

module.exports = new EDPlugin({load: async function() {
    try {require.resolve("./pluginapi.jsm");}
    catch(e) {
        return alert("Hi there,\n\nIn order to use Zerebos' plugins please download his ED plugin api and put it in the plugins folder like any other plugin (keep the extension as .jsm though).\n\n https://raw.githubusercontent.com/rauenzi/EnhancedDiscordPlugins/master/pluginapi.jsm");
    }
    while (typeof window.webpackJsonp === "undefined")
        await this.sleep(1000); // wait until this is loaded in order to use it for modules

    const Api = require("./pluginapi.jsm");
    const compiledPlugin = compilePlugin(Api.buildPlugin(config));
    this._instantiation = new compiledPlugin();
    this._instantiation.settings = new Proxy({}, {
        get: function() {return new Proxy({}, {
            get: function() {return true;}
        })}
    });
    if (typeof(this._instantiation.onStart) == "function") this._instantiation.onStart();
}});