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

	ns.tprint("\n");
	ns.tprint(`${srv.hostname} [${srv.ip}] <${owner}>`);
	ns.tprint(
		`\t${admin} ${backdoor} hack: ${srv.hackDifficulty}/${srv.requiredHackingSkill} - ${srv.minDifficulty}/${srv.baseDifficulty}`
	);
	ns.tprint(`\tRAM ${srv.ramUsed}/${srv.maxRam} CORES: ${srv.cpuCores}`);
	ns.tprint(
		`\tPORTS: ${srv.openPortCount} / ${
			srv.numOpenPortsRequired
		} [${ports.toString()}]`
	);
	ns.tprint(
		`\t$: ${srv.moneyAvailable} / ${srv.moneyMax} - ${srv.serverGrowth}`
	);
	ns.tprint("\nACTIVE PROCESSES\n");

	for (let idx in processes) {
		ns.tprint(
			`\t[Threads:${processes[idx].threads}] [pid:${processes[idx].pid}] ${processes[idx].filename} ${processes[idx].args}`
		);
	}

	ns.tprint("\n");
};
