/** @param {NS} ns **/
import { serverInfo } from "/scripts/lib/server-info.js";

export async function main(ns) {
	let hn = ns.getHostname();
	let servers = {};
	let toSearch = [hn];

	await ns.rm("server-list.txt");

	while (toSearch.length > 0) {
		let target = toSearch.shift(); // pick our current target and remove it from list to search

		// don't look at personal servers
		if (!target.includes("pserv")) {
			servers[target] = serverInfo(ns, target); // Get the server info and add it to our array
			let newServers = ns.scan(target); // Find whatever servers it has access to
			newServers = newServers.filter((s) => {
				return !Object.keys(servers).includes(s); // If we've already found it, the skip it
			});

			toSearch = toSearch.concat(newServers); // Add unknown servers to our search list.
		}
	}

	delete servers["home"]; // We don't need to talk to home

	await ns.write("server-list.txt", JSON.stringify(servers), "w"); // Store our list of servers permanently.
}
