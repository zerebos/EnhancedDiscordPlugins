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

		const SelectedChannelStore = window.findModule("getLastSelectedChannelId", true);
		const UserTypingStore = window.findModule("isTyping", true);
		const UserStatusStore = window.findModule("getStatuses", true);
		const UserActivityStore = window.findModule("getActivity", true);
		
		const Avatar = this.find(m => m.displayName == "Avatar");
		
		window.monkeyPatch(Avatar.prototype, "componentWillMount", (data) => {
			const thisObject = data.thisObject;
			
			if (thisObject.props.size == "large") {
				let userId = thisObject.props.user.id;
				let channelId = SelectedChannelStore.getChannelId();

				thisObject.props.onTypingUpdate = () => {
					let newStatus = UserTypingStore.isTyping(channelId, userId);
					if (thisObject.props.typing == newStatus) return;
					thisObject.props.typing = newStatus;
					thisObject.forceUpdate();
				};

				thisObject.props.onStatusUpdate = () => {
					let newStatus = UserStatusStore.getStatus(userId);
					let newStreaming = UserActivityStore.getActivity(userId) && UserActivityStore.getActivity(userId).type === 1;
					if (thisObject.props.status == newStatus && thisObject.props.streaming == newStreaming) return;
					thisObject.props.status = newStatus;
					thisObject.props.streaming = newStreaming;
					thisObject.forceUpdate();
				};

				UserTypingStore.addChangeListener(thisObject.props.onTypingUpdate);
				UserStatusStore.addChangeListener(thisObject.props.onStatusUpdate);

				thisObject.props.onTypingUpdate();
				thisObject.props.onStatusUpdate();
			}
			
			data.callOriginalMethod();
			return data.returnValue;
		});
		
		window.monkeyPatch(Avatar.prototype, "render", (data) => {
			const thisObject = data.thisObject;
			if (thisObject.props.size == "large") {
				thisObject.props.status = UserStatusStore.getStatus(thisObject.props.user.id);
				thisObject.props.streaming = UserActivityStore.getActivity(thisObject.props.user.id) && UserActivityStore.getActivity(thisObject.props.user.id).type === 1;
				thisObject.props.typing = UserTypingStore.isTyping(SelectedChannelStore.getChannelId(), thisObject.props.user.id);
			}
			data.callOriginalMethod();
			return data.returnValue;
		});

		window.monkeyPatch(Avatar.prototype, "componentWillUnmount", (data) => {
			const thisObject = data.thisObject;
			if (thisObject.props.size == "large") {
				UserTypingStore.removeChangeListener(thisObject.props.onTypingUpdate);
				UserStatusStore.removeChangeListener(thisObject.props.onStatusUpdate);
			}
			data.callOriginalMethod();
			return data.returnValue;
		});
	},
	unload: function() {
		const Avatar = this.find(m => m.displayName == "Avatar");
		if (!Avatar) return;
		if (Avatar.prototype.componentWillMount.__monkeyPatched) Avatar.prototype.componentWillMount.unpatch();
		if (Avatar.prototype.render.__monkeyPatched) Avatar.prototype.render.unpatch();
		if (Avatar.prototype.componentWillUnmount.__monkeyPatched) Avatar.prototype.componentWillUnmount.unpatch();
	},	
	find: function(filter) {
		let req = window.req;
		for (let i in req.c) {
			if (req.c.hasOwnProperty(i)) {
				let m = req.c[i].exports;
				if (m && m.__esModule && m.default && filter(m.default)) return m.default;
				if (m && filter(m))	return m;
			}
		}
		this.warn('Cannot find module');
		return null;
	}
});
