const Plugin = require("../plugin");
const config = {"info":{"name":"BlurNSFW","authors":[{"name":"Zerebos","discord_id":"249746236008169473","github_username":"rauenzi","twitter_username":"ZackRauen"}],"version":"0.2.0","description":"Blurs images in NSFW channels until you hover over it. Support Server: bit.ly/ZeresServer","github":"https://github.com/rauenzi/BetterDiscordAddons/tree/master/Plugins/BlurNSFW","github_raw":"https://raw.githubusercontent.com/rauenzi/BetterDiscordAddons/master/Plugins/BlurNSFW/BlurNSFW.plugin.js"},"main":"index.js"};
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
    const {Patcher, WebpackModules, DiscordModules, DOMTools} = Api;

    const SelectedChannelStore = DiscordModules.SelectedChannelStore;
    const ChannelStore = DiscordModules.ChannelStore;
    const ReactDOM = DiscordModules.ReactDOM;
    const InlineMediaWrapper = WebpackModules.getByProps("ImageReadyStates").default;

    return class BlurNSFW extends Plugin {
        constructor() {
            super();
            this.style = `:root {--blur-nsfw: 10px; --blur-nsfw-time: 200ms;}
            img.blur:hover,
            video.blur:hover {
                transition: var(--blur-nsfw-time) cubic-bezier(.2, .11, 0, 1) !important;
                filter: blur(0px) !important;
            }
            
            img.blur,
            video.blur {
                filter: blur(var(--blur-nsfw)) !important;
                transition: var(--blur-nsfw-time) cubic-bezier(.2, .11, 0, 1) !important;
            }`;
            this.cancels = [];
        }

        onStart() {
            document.head.append(DOMTools.createElement(`<style id="${this.getName()}">${this.style}</style>`));    
            const blurAccessory = (thisObject) => {
                const channel = ChannelStore.getChannel(SelectedChannelStore.getChannelId());
                if (!channel.isNSFW()) return;
                const element = ReactDOM.findDOMNode(thisObject);
                const mediaElement = element.querySelector("img") || element.querySelector("video");
                if (!mediaElement) return;
    
                mediaElement.classList.add("blur");
                
                if (mediaElement.tagName !== "VIDEO") return;
                mediaElement.addEventListener("play", () => {
                    if (mediaElement.autoplay) return;
                    mediaElement.classList.remove("blur");
                });
                mediaElement.addEventListener("pause", () => {
                    if (mediaElement.autoplay) return;
                    mediaElement.classList.add("blur");
                });
            };
            
            Patcher.after(InlineMediaWrapper.prototype, "componentDidMount", blurAccessory);
            Patcher.after(InlineMediaWrapper.prototype, "componentDidUpdate", blurAccessory);
        }
        
        onStop() {
            Patcher.unpatchAll();
            document.querySelector(`style#${this.getName()}`).remove();
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