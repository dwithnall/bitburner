/** @param {NS} ns **/

import { crackServer } from "/scripts/lib/crack-server.js";
import { milliseconds } from "/scripts/lib/tools.js";

export async function main(ns) {
	ns.disableLog("ALL");

	const loopDelay = milliseconds(0, 10, 0); // wait 10 mins between scans
	const processAll = ns.args[0] === "all" ? true : false;
	const srvList = JSON.parse(ns.read("server-list.txt"));
	let pwn = true;

	while (pwn) {
		for (let srvIdx in srvList) {
			let srv = srvList[srvIdx];

			const srvDetails = ns.getServer(srv.host);

			let hack = false;
			if (!hack && srvDetails.openPortCount < 5) hack = true;
			if (!hack && !srvDetails.backdoorInstalled) hack = true;
			if (!hack && !srvDetails.hasAdminRights) hack = true;
			if (!hack && !ns.fileExists("pwned.txt", srv.host)) hack = true;

			if (hack && (await crackServer(ns, srv, processAll))) {
				// only try cracking a server if  we haven't pwned it already.
				// Start pilfering
				ns.run("/scripts/cnc.js", 1, "exec", srv.host, "pilfer", srv.host);
				// Flag the server as pwned.
				await ns.scp("pwned.txt", "home", srv.host);
				ns.tprint(`PWNED ${srv.host}`);
			}
		}
		//pwn = false;
		await ns.sleep(loopDelay);
	}
}
