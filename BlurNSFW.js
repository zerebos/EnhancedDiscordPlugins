const Plugin = require("../plugin");

const config = {"info":{"name":"BlurNSFW","authors":[{"name":"Zerebos","discord_id":"249746236008169473","github_username":"rauenzi","twitter_username":"ZackRauen"}],"version":"0.2.0","description":"Blurs images in NSFW channels until you hover over it. Support Server: bit.ly/ZeresServer","github":"https://github.com/rauenzi/BetterDiscordAddons/tree/master/Plugins/BlurNSFW","github_raw":"https://raw.githubusercontent.com/rauenzi/BetterDiscordAddons/master/Plugins/BlurNSFW/BlurNSFW.plugin.js"},"main":"index.js"};

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