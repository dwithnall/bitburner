/** @param {NS} ns **/

export async const spiderFiles = (ns) => {
	const srvList = JSON.parse(ns.read("server-list.txt"));

	let servers = {};

	ns.rm("file-list.txt");
	for (let srv in srvList) {
		let filelist = ns.ls(srv);

		let idx = filelist.indexOf("pwned.txt");
		if (idx > -1) filelist.splice(idx, 1);

		for (let script in scripts) {
			ns.tprint(scripts[script].file);
			idx = filelist.indexOf(scripts[script].file);
			if (idx > -1) filelist.splice(idx, 1);
		}

		servers[srv] = filelist;
	}

	await ns.write("file-list.txt", JSON.stringify(servers), "w"); // Store our list of servers permanently.
}
