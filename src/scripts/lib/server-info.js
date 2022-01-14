/** @param {NS} ns **/

export const serverInfo = (ns, host) => {
	return {
		host,
		portReq: ns.getServerNumPortsRequired(host),
		hackReq: ns.getServerRequiredHackingLevel(host),
		maxMoney: ns.getServerMaxMoney(host),
		growth: ns.getServerGrowth(host),
		minSec: ns.getServerMinSecurityLevel(host),
		maxRam: ns.getServerMaxRam(host),
		root: ns.hasRootAccess(host),
	};
};

export const portCount = (ns, target) => {
	let openPorts = 0;
	if (ns.sqlinject(target)) openPorts++;
	if (ns.httpworm(target)) openPorts++;
	if (ns.relaysmtp(target)) openPorts++;
	if (ns.ftpcrack(target)) openPorts++;
	if (ns.brutessh(target)) openPorts++;

	return openPorts;
};
