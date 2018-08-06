const Plugin = require("../plugin");
const config = {"info":{"name":"StatusEverywhere","authors":[{"name":"Zerebos","discord_id":"249746236008169473","github_username":"rauenzi","twitter_username":"ZackRauen"}],"version":"0.4.0","description":"Adds user status everywhere Discord doesn't. Support Server: bit.ly/ZeresServer","github":"https://github.com/rauenzi/BetterDiscordAddons/tree/master/Plugins/StatusEverywhere","github_raw":"https://raw.githubusercontent.com/rauenzi/BetterDiscordAddons/master/Plugins/StatusEverywhere/StatusEverywhere.plugin.js"},"changelog":[{"title":"Bugs Squashed","type":"fixed","items":["Updated for Discord changes."]}],"main":"index.js"};
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
    const {Patcher, WebpackModules, DiscordModules} = Api;
    return class StatusEverywhere extends Plugin {
        onStart() {
            const Avatar = WebpackModules.getByProps("AvatarWrapper");
            const original = Avatar.default;
            Patcher.before(Avatar, "default", (_, args) => {
                if (args[0].status) return;
                const id = args[0].src.split("/")[4];
                args[0].status = DiscordModules.UserStatusStore.getStatus(id);
            });
            Object.assign(Avatar.default, original);
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