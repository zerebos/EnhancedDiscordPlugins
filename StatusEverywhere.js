const Plugin = require('../plugin');

module.exports = new Plugin({
	name: 'StatusEverywhere',
	id: "StatusEverywhere",
	author: 'Zerebos#7790',
	description: "Adds status to anywhere there is an Avatar.",
	color: '#43B581',

	load: async function() {
		while (!window.findModule('getStatuses', true) || !this.find(m => m.displayName == "Avatar"))
			await this.sleep(1000);
		
		const UserStatusStore = window.findModule("getStatuses", true);
		const Avatar = window.findModule("AvatarWrapper");
		const original = Avatar.default;
		window.monkeyPatch(Avatar, "default", (data) => {
			if (data.methodArguments[0].status) return;
			const id = data.methodArguments[0].src.split("/")[4];
			data.methodArguments[0].status = UserStatusStore.getStatus(id);
			data.callOriginalMethod();
			return data.returnValue;
		});
		Object.assign(Avatar.default, original);
	},
	unload: function() {
		const Avatar = window.findModule("AvatarWrapper");
		if (!Avatar) return;
		if (Avatar.default.__monkeyPatched) Avatar.default.unpatch();
	}
});
