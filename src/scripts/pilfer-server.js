/** @param {NS} ns **/

export async function main(ns) {
	ns.disableLog("getServerMaxMoney");
	ns.disableLog("getServerMinSecurityLevel");
	ns.disableLog("getServerSecurityLevel");
	ns.disableLog("getServerMoneyAvailable");
	ns.disableLog("grow");
	ns.disableLog("hack");

	const target = ns.args[0];
	const moneyThreshold = ns.getServerMaxMoney(target) * 0.75;
	const securityThreshold = ns.getServerMinSecurityLevel(target) + 1;

	while (true) {
		if (ns.getServerSecurityLevel(target) > securityThreshold) {
			await ns.weaken(target);
		} else if (ns.getServerMoneyAvailable(target) < moneyThreshold) {
			await ns.grow(target);
		} else {
			await ns.hack(target);
		}
	}
}
