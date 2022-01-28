import { getSettings, getItem, dateTime } from "common.js";

const scriptsToKill = [
	"mainHack.js",
	"spider.js",
	"grow.js",
	"hack.js",
	"weaken.js",
	"playerServers.js",
	"runHacking.js",
	"initHacking.js",
	"start.js",
	"find.js",
];

export async function main(ns) {
	debugger;

	ns.tprint(`[${dateTime()}] Starting killAll.js`);
	const settings = getSettings();
	const scriptToRunAfter = ns.args[0];

	const serverMap = getItem(settings.keys.serverMap);

	if (
		!serverMap ||
		serverMap.lastUpdate < new Date().getTime() - settings.mapRefreshInterval
	) {
		ns.tprint(`[${dateTime()}] Spawning spider.js`);
		ns.spawn("spider.js", 1, "killAll.js");
		ns.exit();
		return;
	}

	for (let i = 0; i < scriptsToKill.length; i++) {
		await ns.scriptKill(scriptsToKill[i], "home");
	}

	const killAbleServers = Object.keys(serverMap.servers)
		.filter((hostname) => ns.serverExists(hostname))
		.filter((hostname) => hostname !== "home");

	for (let i = 0; i < killAbleServers.length; i++) {
		await ns.killall(killAbleServers[i]);
	}

	ns.tprint(`[${dateTime()}] All processes killed`);

	if (scriptToRunAfter) {
		ns.tprint(`[${dateTime()}] Spawning ${scriptToRunAfter}`);
		ns.spawn(scriptToRunAfter, 1);
	} else {
		ns.tprint(`[${dateTime()}] Spawning runHacking.js`);
		ns.spawn("runHacking.js", 1);
	}
}
