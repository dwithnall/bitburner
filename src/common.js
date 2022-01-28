export function getSettings() {
	let settings = getItem("settings");
	if (settings) return settings;

	// Settings haven't been defined
	settings = {
		minSecurityLevelOffset: 2,
		maxMoneyMultiplayer: 0.9,
		minSecurityWeight: 100,
		mapRefreshInterval: 24 * 60 * 60 * 1000,
		keys: {
			serverMap: "BB_SERVER_MAP",
			hackTarget: "BB_HACK_TARGET",
			action: "BB_ACTION",
		},
	};

	setItem("settings", settings);
	return settings;
}

export function getItem(key) {
	let item = localStorage.getItem(key);
	return item ? JSON.parse(item) : undefined;
}

export function setItem(key, value) {
	localStorage.setItem(key, JSON.stringify(value));
}

export async function main(ns) {
	return {
		settings,
		getItem,
		setItem,
	};
}

export function dateTime(ms = 0) {
	if (!ms) {
		ms = new Date().getTime();
	}

	return new Date(ms).toLocaleTimeString();
}
