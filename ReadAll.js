const Plugin = require("../plugin");

module.exports = new Plugin({
    name: "ReadAll",
    author: "Zerebos#7790",
    description: "Adds button to the guilds list that marks all guilds as read.",

    load: async function() {
		const buttonStyle = `
			#ReadAll-button {
				cursor: pointer;
				padding: 2px;
				transition: background 100ms ease;
			}
			
			#ReadAll-button:hover {
				background: rgba(255,255,255,0.1);
			}
			
			#ReadAll-button:active {
				background: rgba(255,255,255,0.3);
			}
		`;
		const GuildStore = window.findModule("getGuilds");
		const GuildActions = window.findModule("markGuildAsRead");
		const GuildClasses = window.findModule("guildsWrapper");
		const FriendsOnline = window.findModule("friendsOnline").friendsOnline;
		const styleElement = document.createElement("style");
		styleElement.id = "ReadAll-css";
		styleElement.innerHTML = buttonStyle;
		document.head.append(styleElement);
		
		const button = document.createElement("div");
		button.id = "ReadAll-button";
		button.textContent = "Read All";
		button.classList.add(FriendsOnline);
		button.addEventListener("click", () => {
			for (let g in GuildStore.getGuilds()) GuildActions.markGuildAsRead(g);
		});
		while (!document.querySelector(`.${GuildClasses.guildSeparator}`)) await this.sleep(100);
		document.querySelector(`.${GuildClasses.guildSeparator}`).insertAdjacentElement("afterend", button);
    },

    unload: function() {
		if (document.querySelector("#ReadAll-button")) document.querySelector("#ReadAll-button").remove();
		if (document.querySelector("#ReadAll-css")) document.querySelector("#ReadAll-css").remove();
    }
});
