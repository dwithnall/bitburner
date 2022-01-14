/** @param {NS} ns **/

import { programs } from "/scripts/lib/constants.js";
import { portCount } from "/scripts/lib/server-info.js";

export async function crackServer(ns, srv, processAll) {
	ns.disableLog("ALL");

	let srvDetails = ns.getServer(srv.host);
	const curHackLvl = ns.getHackingLevel();
	const curSoftware = programs.filter((progName) =>
		ns.fileExists(progName, "home")
	);

	const log = false;

	if (curHackLvl < srv.hackReq || curSoftware.length < srv.portReq) {
		if (log) ns.print(`Can't hack - ${srv.host}`);
		return false; // We can't hack it so don't try
	}

	if (!ns.hasRootAccess(srv.host) || processAll) {
		while (curSoftware.length > 0) {
			let prog = curSoftware.shift();

			switch (prog) {
				case "BruteSSH.exe":
					if (!srvDetails.sshPortOpen)
						if (log) ns.tprint(`${srv.host}: BruteSSH`);
					break;
				case "FTPCrack.exe":
					if (!srvDetails.ftpPortOpen)
						if (log) ns.tprint(`${srv.host}: FTPCrack`);
					break;
				case "relaySMTP.exe":
					if (!srvDetails.smtpPortOpen)
						if (log) ns.tprint(`${srv.host}: relaySMTP`);
					break;
				case "HTTPWorm.exe":
					if (!srvDetails.httpPortOpen)
						if (log) ns.tprint(`${srv.host}: HTTPWorm`);
					break;
				case "SQLInject.exe":
					if (!srvDetails.sqlPortOpen)
						if (log) ns.tprint(`${srv.host}: SQLInject`);
					break;
			}
			await ns.sleep(500);
		}

		if (!srvDetails.portReq <= portCount(ns, srv.host)) {
			if (ns.nuke(srv.host)) ns.tprint(`PWND ${srvDetails.host}`);
		}
	}
	return true;
}
