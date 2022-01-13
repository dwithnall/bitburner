/** @param {NS} ns **/

import { crackServer } from "/scripts/lib/crack-server.js";

export async function main(ns) {
	ns.disableLog("scp");
	ns.disableLog("exec");
	ns.disableLog("sleep");
	ns.disableLog("fileExists");
	ns.disableLog("getScriptRam");

	const srvList = JSON.parse(ns.read("server-list.txt"));
	let pwn = true;

	while (pwn) {
		for (let srvIdx in srvList) {
			let srv = srvList[srvIdx];

			// only try cracking a server if  we haven't pwned it already.
			if (
				(await crackServer(ns, srv)) &&
				!ns.fileExists("pwned.txt", srv.host)
			) {
				// Start pilfering
				ns.run("/scripts/cnc.js", 1, ["exec", srv.host, "pilfer", "self"]);

				// Flag the server as pwned.
				await ns.scp("pwned.txt", "home", srv.host);
				ns.print(`PWNED ${srv.host}`);
			}
		}
		//pwn = false;
		await ns.sleep(500);
	}
}
