const Plugin = require("../plugin");
const config = {"info":{"name":"ImageToClipboard","authors":[{"name":"Zerebos","discord_id":"249746236008169473","github_username":"rauenzi","twitter_username":"ZackRauen"}],"version":"0.3.0","description":"Copies images (png/jpg) directly to clipboard. Support Server: bit.ly/ZeresServer","github":"https://github.com/rauenzi/BetterDiscordAddons/tree/master/Plugins/ImageToClipboard","github_raw":"https://raw.githubusercontent.com/rauenzi/BetterDiscordAddons/master/Plugins/ImageToClipboard/ImageToClipboard.plugin.js"},"main":"index.js"};

try {
	const Api = require("./pluginapi.js");
	const [BasePlugin, BoundAPI] = Api.buildPlugin(config);

	const EDPlugin = class EDPlugin extends BasePlugin {
		get name() {return config.info.name.replace(" ", "");}
		get author() {return config.info.authors.map(a => a.name).join(", ");}
		get description() {return config.info.description;}
		load() {if (typeof(this.onStart) == "function") this.onStart();}
		unload() {if (typeof(this.onStop) == "function") this.onStop();}
	};
	const compilePlugin = (Plugin, Api) => {
		const plugin = (Plugin, Api) => {
    const {Patcher, WebpackModules, DiscordModules, Toasts} = Api;

    const request = window.require("request");
    const fs = require("fs");
    const {clipboard, nativeImage} = require("electron");
    const path = require("path");
    const process = require("process");

    const MediaContextGroup = WebpackModules.getModule(m => m.prototype && m.prototype.constructor && m.prototype.constructor.toString().includes("handleCopyLink"));
    const ContextMenuItem = WebpackModules.getByRegex(/.label\b.*\.hint\b.*\.action\b/);
    const ContextMenuActions = WebpackModules.getByProps("closeContextMenu");

    const ImageModal = WebpackModules.getModule(m => m.prototype && m.prototype.render && m.prototype.render.toString().includes("downloadLink"));
    const DownloadLink = WebpackModules.getModule(m => m.toString && m.toString().includes("isSafeRedirect"));
    const DLClasses = WebpackModules.getByProps("downloadLink");

    return class BlurNSFW extends Plugin {

        onStart() {
            Patcher.after(MediaContextGroup.prototype, "render", (t,a,r) => {
                if (r) r.props.children.push(DiscordModules.React.createElement(ContextMenuItem, {
                    label: this.strings.contextMenuLabel,
                    action: () => {
                        ContextMenuActions.closeContextMenu();
                        this.copyToClipboard(t.props.href || t.props.src);
                    }
                }));
            });

            Patcher.after(ImageModal.prototype, "render", (t,a,r) => {
                if (r) r.props.children.push(DiscordModules.React.createElement(DownloadLink, {
                            className: DLClasses.downloadLink,
                            title: this.strings.modalLabel,
                            target: "_blank",
                            rel: "noreferrer noopener",
                            href: t.props.original,
                            onClick: (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                this.copyToClipboard(t.props.original);
                            }
                }, this.strings.modalLabel));
            });
        }
        
        onStop() {
            Patcher.unpatchAll();
        }

        copyToClipboard(url) {
            request({url: url, encoding: null}, (error, response, buffer) => {
                if (error) {
                    Toasts.error(this.strings.copyFailed, {type: "danger"});
                    return;
                }
                if (process.platform === "win32" || process.platform === "darwin") {
                    clipboard.write({image: nativeImage.createFromBuffer(buffer)});
                }
                else {
                        const file = path.join(process.env["HOME"], "i2ctemp.png");
                        fs.writeFileSync(file, buffer, {encoding: null});
                        clipboard.write({image: file});
                        fs.unlinkSync(file);
                }
                Toasts.success(this.strings.copySuccess, {type: "success"});
            });
        }

        get strings() {
            switch (DiscordModules.UserSettingsStore.locale.split("-")[0]) {
                case "es": // Spanish
                    return {
                        contextMenuLabel: "Copiar Imagen",
                        modalLabel: "Copiar Original",
                        copySuccess: "Imagen copiada al portapapeles.",
                        copyFailed: "Hubo un problema al copiar la imagen."
                    };
                case "pt": // Portuguese
                    return {
                        contextMenuLabel: "Copiar imagem",
                        modalLabel: "Copiar original",
                        copySuccess: "Imagem copiada para a área de transferência",
                        copyFailed: "Houve um problema ao copiar a imagem"
                    };
                case "de": // German
                    return {
                        contextMenuLabel: "Kopiere das Bild",
                        modalLabel: "Original Kopieren",
                        copySuccess: "Bild in die Zwischenablage kopiert.",
                        copyFailed: "Beim Kopieren des Bildes ist ein Problem aufgetreten."
                    };
                default: // English
                    return {
                        contextMenuLabel: "Copy Image",
                        modalLabel: "Copy Original",
                        copySuccess: "Image copied to clipboard.",
                        copyFailed: "There was an issue copying the image."
                    };
            }
        }

    };
};
		return plugin(Plugin, Api);
	};

	module.exports = new (compilePlugin(EDPlugin, BoundAPI))();
}
catch (err) {
	module.exports = new Plugin({
		name: config.info.name.replace(" ", ""),
		author: config.info.authors.map(a => a.name).join(", "),
		description: config.info.description,
		load: function() {
			alert("Hi there,\n\nIn order to use Zerebos' plugins please download his ED plugin api and put it in the plugins folder like any other plugin.\n\n https://raw.githubusercontent.com/rauenzi/EnhancedDiscordPlugins/master/pluginapi.js");
		}
	});
}