/** @param {NS} ns **/

import { scripts } from "/scripts/lib/constants.js";

export const killRunningScripts = (ns, target) => {
	const srvList = JSON.parse(ns.read("server-list.txt"));

	if (target !== "all" && !(target in srvList)) {
		ns.tprint("invalid server");
		return;
	}

	switch (target) {
		case "all":
			for (let srv in srvList) {
				ns.killall(srv);
			}
			break;
		default:
			ns.killall(target);
			break;
	}
};

async function clean(ns, target) {
	ns.killall(target);
	ns.rm("pwned.txt", target);

	for (const script in scripts) {
		ns.rm(scripts[script].file, target);
	}
}

export async function cleanServers(ns, target) {
	if (target !== "all" && !(target in srvList)) {
		ns.tprint("invalid server");
		return;
	}

	switch (target) {
		case "all":
			const srvList = JSON.parse(ns.read("server-list.txt"));
			for (let srv in srvList) {
				if (ns.hasRootAccess(srv)) await clean(ns, srv);
			}
			break;
		default:
			await clean(ns, target);
			break;
	}
}

async function exec(ns, srv, script, target) {
	const ramAvailable =
		ns.getServerMaxRam(srv) -
		ns.getServerUsedRam(srv) -
		ns.getScriptRam(script);

	if (ramAvailable < 0) {
		ns.tprint(`${srv} low RAM`);
		return; // server doesn't have enough ram to run the script
	}

	await ns.scp(script, "home", srv); // make sure host has the current script version

	let threads = Math.floor(ns.getServerMaxRam(srv) / ns.getScriptRam(script)); // calc threads to run

	ns.tprint(`${srv} executing ${script} on ${target} #threads: ${threads}`);

	ns.exec(script, srv, threads, target);
}

export async function remoteExecute(ns, execServer, script, targetServer = "") {
	const srvList = JSON.parse(ns.read("server-list.txt"));

	// check execution server exists
	if (
		execServer !== "self" &&
		execServer !== "all" &&
		!(execServer in srvList)
	) {
		ns.tprint("invalid execution server");
		return;
	}

	// check target server exists
	if (
		targetServer !== "self" &&
		(targetServer === "" || !(targetServer in srvList))
	) {
		ns.tprint("invalid target server");
		return;
	}

	switch (execServer) {
		case "self":
			for (let srv in srvList) {
				if (ns.hasRootAccess(srv)) await exec(ns, srv, script, srv);
			}
			break;
		case "all":
			for (let srv in srvList) {
				const target = targetServer === "self" ? srv : targetServer;
				if (ns.hasRootAccess(srv)) await exec(ns, srv, script, target);
			}
			break;
		default:
			if (ns.hasRootAccess(execServer))
				await exec(ns, execServer, script, targetServer);
			break;
	}
}
