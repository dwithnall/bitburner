/** @param {NS} ns **/

export async function main(ns) {
	ns.disableLog("ALL");

	const target = ns.args[0];
	const moneyThreshold = ns.getServerMaxMoney(target) * 0.75;
	const securityThreshold = ns.getServerMinSecurityLevel(target) + 1;

	while (true) {
		if (ns.getServerSecurityLevel(target) > securityThreshold) {
			ns.print(`WEAKEN: ${target}`);
			await ns.weaken(target);
		} else if (
			moneyThreshold > 0 &&
			ns.getServerMoneyAvailable(target) < moneyThreshold
		) {
			ns.print(`GROW: ${target}`);
			await ns.grow(target);
		} else {
			ns.print(`HACK: ${target}`);
			await ns.hack(target);
		}
	}
}
