/** @param {NS} ns **/

import { programs } from "/scripts/lib/constants.js";

export async function crackServer(ns, srv) {
	ns.disableLog("ALL");

	const srvDetails = ns.getServer(srv.host);
	const curHackLvl = ns.getHackingLevel();
	const curSoftware = programs.filter((progName) =>
		ns.fileExists(progName, "home")
	);

	const debug = true;
	const log = true;

	if (curHackLvl < srv.hackReq || curSoftware.length < srv.portReq) {
		if (log) ns.tprint(`Can't hack - ${srv.host}`);
		return false; // We can't hack it so don't try
	}

	if (!ns.hasRootAccess(srv.host) || debug) {
		while (curSoftware.length > 0) {
			let prog = curSoftware.shift();

			switch (prog) {
				case "NUKE.exe":
					if (!srvDetails.hasAdminRights) {
						if (log) ns.tprint(`${srv.host}: NUKE`);
						ns.nuke(srv.host);
					}
					break;
				case "BruteSSH.exe":
					if (!srvDetails.sshPortOpen) {
						if (log) ns.tprint(`${srv.host}: BruteSSH`);
						ns.brutessh(srv.host);
					}
					break;
				case "FTPCrack.exe":
					if (!srvDetails.ftpPortOpen) {
						if (log) ns.tprint(`${srv.host}: FTPCrack`);
						ns.ftpcrack(srv.host);
					}
					break;
				case "relaySMTP.exe":
					if (!srvDetails.smtpPortOpen) {
						if (log) ns.tprint(`${srv.host}: relaySMTP`);
						ns.relaysmtp(srv.host);
					}
					break;
				case "HTTPWorm.exe":
					if (!srvDetails.httpPortOpen) {
						if (log) ns.tprint(`${srv.host}: HTTPWorm`);
						ns.httpworm(srv.host);
					}
					break;
				case "SQLInject.exe":
					if (!srvDetails.sqlPortOpen) {
						if (log) ns.tprint(`${srv.host}: SQLInject`);
						ns.sqlinject(srv.host);
					}
					break;
			}
			await ns.sleep(500);
		}
	}
	return true;
}
