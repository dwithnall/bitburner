// the purpose of weak-target is to wait until an appointed time and then execute a weaken.

export async function main(ns) {
	await ns.sleep(parseInt(ns.args[1]) - Date.now());
	await ns.weaken(ns.args[0]);
}
