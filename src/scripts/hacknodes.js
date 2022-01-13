/**
 * @param {NS} ns
 **/

export async function main(ns) {
	const allowancePct = 0.15; // 15%
	while (true) {
		let allowedCash = ns.getServerMoneyAvailable("home") * allowancePct;

		// Try buying a node first
		if (ns.hacknet.getPurchaseNodeCost() < allowedCash) {
			ns.hacknet.purchaseNode();
		} else {
			// iterate through all our nodes and upgrade them in order
			for (let i = 0, len = ns.hacknet.numNodes(); i < len; i++) {
				// Level
				if (ns.hacknet.getLevelUpgradeCost(i, 1) < allowedCash) {
					ns.hacknet.upgradeLevel(i, 1);
					break;

					// RAM
				} else if (ns.hacknet.getRamUpgradeCost(i, 1) < allowedCash) {
					ns.hacknet.upgradeRam(i, 1);
					break;

					// Cores
				} else if (ns.hacknet.getCoreUpgradeCost(i, 1) < allowedCash) {
					ns.hacknet.upgradeCore(i, 1);
					break;
				}
			}
		}
		await ns.sleep(500);
	}
}
