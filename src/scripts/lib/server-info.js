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
