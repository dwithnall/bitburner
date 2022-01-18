/** @param {NS} ns **/

const crackNames = [
	"BruteSSH.exe",
	"FTPCrack.exe",
	"relaySMTP.exe",
	"HTTPWorm.exe",
	"SQLInject.exe",
];

export const buildPortCrackingArray = (ns) => {
	let portCrackers = [];

	for (var i = 0; i < crackNames.length; i++) {
		var cracker = new Crack(ns, crackNames[i]);
		portCrackers.push(cracker);
	}

	return portCrackers;
};

export class Crack {
	ns;
	name;

	constructor(ns, name) {
		this.ns = ns;
		this.name = name;
	}

	exist() {
		return this.ns.fileExists(crackName, "home");
	}

	runAt(target) {
		switch (this.name) {
			case "BruteSSH.exe":
				this.ns.brutessh(target);
				break;
			case "FTPCrack.exe":
				this.ns.ftpcrack(target);
				break;
			case "relaySMTP.exe":
				this.ns.relaysmtp(target);
				break;
			case "HTTPWorm.exe":
				this.ns.httpworm(target);
				break;
			case "SQLInject.exe":
				this.ns.sqlinject(target);
				break;
		}
	}
	// I made this a function of the crackers out of laziness.
	doNuke(target) {
		this.ns.nuke(target);
	}
}
