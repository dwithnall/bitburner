import { getSettings, setItem, dateTime } from "common.js";

let hackPrograms = [];

function getPlayerDetails(ns) {
	let portHacks = 0;

	hackPrograms.forEach((hackProgram) => {
		if (ns.fileExists(hackProgram.file, "home")) {
			portHacks += 1;
		}
	});

	return {
		hackingLevel: ns.getHackingLevel(),
		portHacks,
	};
}

export async function main(ns) {
	ns.tprint(`[${dateTime()}] Starting spider.js`);

	const scriptToRunAfter = ns.args[0];

	let hostname = ns.getHostname();

	if (hostname !== "home") {
		throw new Exception("Run the script from home");
	}

	hackPrograms = [
		{ file: "BruteSSH.exe", execute: ns.brutessh },
		{ file: "FTPCrack.exe", execute: ns.ftpcrack },
		{ file: "relaySMTP.exe", execute: ns.relaysmtp },
		{ file: "HTTPWorm.exe", execute: ns.httpworm },
		{ file: "SQLInject.exe", execute: ns.sqlinject },
	];

	const serverMap = { servers: {}, lastUpdate: new Date().getTime() };
	const scanArray = ["home"];

	while (scanArray.length) {
		// Iterate all the server's connected to current
		const host = scanArray.shift(); // remove the first one

		serverMap.servers[host] = {
			// Collect server details
			host,
			ports: ns.getServerNumPortsRequired(host),
			hackingLevel: ns.getServerRequiredHackingLevel(host),
			maxMoney: ns.getServerMaxMoney(host),
			growth: ns.getServerGrowth(host),
			minSecurityLevel: ns.getServerMinSecurityLevel(host),
			baseSecurityLevel: ns.getServerBaseSecurityLevel(host),
			ram: ns.getServerRam(host)[0],
			files: ns.ls(host),
		};

		const playerDetails = getPlayerDetails(ns); // Get our own details

		if (!ns.hasRootAccess(host)) {
			// If we don't have root check if we can get it.
			if (
				serverMap.servers[host].ports <= playerDetails.portHacks &&
				serverMap.servers[host].hackingLevel <= playerDetails.hackingLevel
			) {
				hackPrograms.forEach((hackProgram) => {
					// We can hack it so open every port we can
					if (ns.fileExists(hackProgram.file, "home")) {
						hackProgram.execute(host);
					}
				});
				ns.nuke(host); // Then nuke it
			}
		}

		// Get connected servers and store them
		const connections = ns.scan(host);
		serverMap.servers[host].connections = connections;

		// Build the connections between the servers
		if (host !== "home") {
			serverMap.servers[host].parent = connections[0];
			serverMap.servers[host].children = connections.slice(1);
		} else {
			serverMap.servers[host].parent = "home";
			serverMap.servers[host].children = connections;
		}

		connections
			.filter((hostname) => !serverMap.servers[hostname]) // Remove any servers we already know
			.forEach((hostname) => scanArray.push(hostname)); // Add the remaining to our todo list
	}

	// Store it all
	let settings = getSettings();
	setItem(settings.keys.serverMap, serverMap);

	// Kick off the next thing
	if (!scriptToRunAfter) {
		ns.tprint(`[${dateTime()}] Spawning mainHack.js`);
		ns.spawn("mainHack.js", 1);
	} else {
		ns.tprint(`[${dateTime()}] Spawning ${scriptToRunAfter}`);
		ns.spawn(scriptToRunAfter, 1);
	}
}
