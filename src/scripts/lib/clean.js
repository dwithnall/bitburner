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
		ns.tprint(`${target} clean ${scripts[script].file}`);
		let res = ns.rm(scripts[script].file, target);
		ns.tprint(`ns.rm(${scripts[script].file}, ${target});`);
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
				await clean(ns, srv);
			}
			break;
		default:
			await clean(ns, target);
			break;
	}
}
