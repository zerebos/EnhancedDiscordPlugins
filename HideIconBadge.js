const Plugin = require("../plugin");
const config = {"info":{"name":"HideIconBadge","authors":[{"name":"Zerebos","discord_id":"249746236008169473","github_username":"rauenzi","twitter_username":"ZackRauen"}],"version":"0.0.3","description":"Hides the badge on the app icon and tray icon. Support Server: bit.ly/ZeresServer","github":"https://github.com/rauenzi/BetterDiscordAddons/tree/master/Plugins/HideIconBadge","github_raw":"https://raw.githubusercontent.com/rauenzi/BetterDiscordAddons/master/Plugins/HideIconBadge/HideIconBadge.plugin.js"},"main":"index.js"};
let hasApi = false;

try {require("./pluginapi.js"); hasApi = true;}
catch(e) {hasApi = false;}

if (hasApi) {
	const Api = require("./pluginapi.js");
	const [BasePlugin, BoundAPI] = Api.buildPlugin(config);

	const EDPlugin = class EDPlugin extends BasePlugin {
		constructor() {super(...arguments); this.settings = this.defaultSettings;}
		get name() {return config.info.name.replace(" ", "");}
		get author() {return config.info.authors.map(a => a.name).join(", ");}
		get description() {return config.info.description;}
		load() {if (typeof(this.onStart) == "function") this.onStart(), this._enabled = true;}
		unload() {if (typeof(this.onStop) == "function") this.onStop(), this._enabled = false;}
	};
	const compilePlugin = (Plugin, Api) => {
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

	module.exports = new (compilePlugin(EDPlugin, BoundAPI))();
}
else {
	module.exports = new Plugin({
		name: config.info.name.replace(" ", ""),
		author: config.info.authors.map(a => a.name).join(", "),
		description: config.info.description,
		load: function() {
			alert("Hi there,\n\nIn order to use Zerebos' plugins please download his ED plugin api and put it in the plugins folder like any other plugin.\n\n https://raw.githubusercontent.com/rauenzi/EnhancedDiscordPlugins/master/pluginapi.js");
		}
	});
}