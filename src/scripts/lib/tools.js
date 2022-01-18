/** @param {NS} ns **/

export const milliseconds = (hrs, min, sec) => {
	return (hrs * 60 * 60 + min * 60 + sec) * 1000;
};

export async function copyFile(ns) {
	if (!ns.fileExists("file-list.txt")) return;

	const fileList = JSON.parse(ns.read("file-list.txt"));

	for (let srv in fileList) {
		ns.tprint(srv);
		let srvFiles = fileList[srv];

		ns.tprint(srvFiles);

		for (let fileIdx in srvFiles) {
			let fileName = srvFiles[fileIdx];

			if (
				fileName.endsWith(".lit") ||
				fileName.endsWith(".script") ||
				fileName.endsWith(".txt")
			) {
				await ns.scp(fileName, srv, "home");
			}
		}
	}
}

export const printSeverStats = (ns, target) => {
	const srv = ns.getServer(target);
	const processes = ns.ps(target);

	let ports = [];
	if (srv.httpPortOpen) ports.push("HTTP");
	if (srv.sshPortOpen) ports.push("SSH");
	if (srv.ftpPortOpen) ports.push("FTP");
	if (srv.smtpPortOpen) ports.push("SMTP");
	if (srv.sqlPortOpen) ports.push("SQL");

	let owner = srv.purchasedByPlayer ? "OWN" : srv.organizationName;
	let backdoor = srv.backdoorInstalled ? "BACKDOOR" : "NO BACKDOOR!";
	let admin = srv.hasAdminRights ? "ADMIN" : "NO ADMIN!";

	let activeProc = [];
	for (let idx in processes) {
		activeProc.push(
			`\t[Threads:${processes[idx].threads}] [pid:${processes[idx].pid}] ${processes[idx].filename} ${processes[idx].args}`
		);
	}

	let str = `
	  ${srv.hostname} [${srv.ip}] <${owner}>
	  ${admin} ${backdoor}
		Hack [Diff/Req]: ${srv.hackDifficulty}/${srv.requiredHackingSkill}
		Diff [Min/Base]: ${srv.minDifficulty}/${srv.baseDifficulty}
	  RAM ${srv.ramUsed}/${srv.maxRam} CORES: ${srv.cpuCores}
	  PORTS: ${srv.openPortCount} / ${
		srv.numOpenPortsRequired
	} [${ports.toString()}]
	  $:${ns.nFormat(srv.moneyAvailable, "0,0")} / $${ns.nFormat(
		srv.moneyMax,
		"0,0"
	)} - +$${ns.nFormat(srv.serverGrowth, "0,0")}
	  ACTIVE PROCESSES
	${activeProc.join("\n")}`;

	ns.tprintf(str);
};

export const rootServers = (ns) => {
	const srvList = JSON.parse(ns.read("server-list.txt"));
	let hackable = [];

	for (let srvIdx in srvList) {
		const srv = srvList[srvIdx];

		if (ns.hasRootAccess(srv.host)) hackable.push(srv.host);
	}

	return hackable;
};
