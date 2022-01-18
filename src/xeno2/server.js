/** @param {NS} ns **/

import * as cnt from "/xeno/constants.js";

export const buildServerList = (ns) => {
	const servers = [];
	let toSearch = [ns.getHostname()];

	while (toSearch.length > 0) {
		let target = toSearch.shift(); // pick our current target and remove it from list to search

		// don't look at personal servers
		if (!target.includes("pserv")) {
			servers.push(target); // Get the server info and add it to our array

			let newServers = ns.scan(target); // Find whatever servers it has access to
			newServers = newServers.filter((s) => {
				return !servers.includes(s); // If we've already found it, the skip it
			});

			toSearch = toSearch.concat(newServers); // Add unknown servers to our search list.
		}
	}

	return servers;
};

export class Server {
	name;
	minSecurity;
	hackingRequired;
	portsRequired;
	maxMoney;
	percentageToSteal = 0.5;
	_ns;

	constructor(ns, name) {
		this._ns = ns;
		this.name = name;
	}

	init() {
		this._ns.disableLog("ALL");
		//	this._ns.tprint(`INIT SERVER - ${this.name}`);

		this.minSecurity = this._ns.getServerMinSecurityLevel(this.name);
		this.hackingRequired = this._ns.getServerRequiredHackingLevel(this.name);
		this.portsRequired = this._ns.getServerNumPortsRequired(this.name);
		this.maxMoney = this._ns.getServerMaxMoney(this.name);
	}

	sortValue() {
		// if the server is at base security, prioritize it.
		// we do this by pretending the time to weaken is really really small.
		var timeToWeakenVar = this.timeToWeaken();
		if (this.curSecurity() > this.minSecurity) {
			timeToWeakenVar = 1;
		}
		return this.maxMoney / (timeToWeakenVar * 2);
	}

	curSecurity() {
		return this._ns.getServerSecurityLevel(this.name);
	}

	timeToWeaken() {
		return this._ns.getWeakenTime(this.name);
	}

	canCrack() {
		return getPortCrackers(this._ns) >= this.portsRequired;
	}
	canHack() {
		return this.hackingRequired <= this._ns.getHackingLevel();
	}
	shouldHack() {
		return (
			this.maxMoney > 0 &&
			this.name !== "home" &&
			!this._ns.getPurchasedServers().includes(this.name)
		);
	}
	money() {
		return this._ns.getServerMoneyAvailable(this.name);
	}

	isPrepping() {
		this._ns.tprint("ISPREPPING?");
		return;
		// then figure out if the servers are running the other 2, that means prep
		for (var s = 0; s < serverListRam.length; s++) {
			var ps = this._ns.ps(serverListRam[s].name);
			for (var p = 0; p < ps.length; p++) {
				var tps = ps[p];
				if (toolNames.includes(tps.filename) && tps.args[0] == this.name) {
					if (tps.args.length > 4 && tps.args[4] == "prep") {
						return true;
					}
				}
			}
		}
		return false;
	}

	isTargeting() {
		this._ns.tprint("IS TARGETING?");
		return;
		// figure out if any server in the network is running scripts against this server
		for (var s = 0; s < serverListRam.length; s++) {
			var ps = this._ns.ps(serverListRam[s].name);
			for (var p = 0; p < ps.length; p++) {
				var tps = ps[p];
				if (toolNames.includes(tps.filename) && tps.args[0] == this.name) {
					if (tps.args.length > 4 && tps.args[4] != "prep") {
						return true;
					}
				}
			}
		}
		return false;
	}

	hasRunningScript(scriptName) {
		return this._ns.scriptRunning(scriptName, this.name);
	}
	serverGrowthPercentage() {
		return (
			(this._ns.getServerGrowth(this.name) *
				bitnodeGrowMult *
				playerHackingGrowMult) /
			100
		);
	}
	adjustedGrowthRate() {
		return Math.min(
			cnt.maxGrowthRate,
			1 + (cnt.unadjustedGrowthRate - 1) / this.minSecurity
		);
	}
	actualServerGrowthRate() {
		return Math.pow(this.adjustedGrowthRate(), this.serverGrowthPercentage());
	}

	// this is the target growth coefficient *immediately*
	targetGrowthCoefficient() {
		return this.maxMoney / Math.max(this.money(), 1);
	}
	// this is the target growth coefficient per cycle, based on theft
	targetGrowthCoefficientAfterTheft() {
		return (
			1 / (1 - this.hackThreadsNeeded() * this.percentageStolenPerHackThread())
		);
	}
	cyclesNeededForGrowthCoefficient() {
		return (
			Math.log(this.targetGrowthCoefficient()) /
			Math.log(this.adjustedGrowthRate())
		);
	}
	cyclesNeededForGrowthCoefficientAfterTheft() {
		return (
			Math.log(this.targetGrowthCoefficientAfterTheft()) /
			Math.log(this.adjustedGrowthRate())
		);
	}
	hackEaseCoefficient() {
		return (100 - Math.min(100, this.minSecurity)) / 100;
	}
	hackingSkillCoefficient() {
		return (
			(this._ns.getHackingLevel() - (this.hackingRequired - 1)) /
			this._ns.getHackingLevel()
		);
	}
	actualHackCoefficient() {
		return (
			(this.hackEaseCoefficient() *
				this.hackingSkillCoefficient() *
				actualHackMultiplier()) /
			240
		);
	}
	percentageStolenPerHackThread() {
		return Math.min(1, Math.max(0, this.actualHackCoefficient()));
	}
	actualPercentageToSteal() {
		return this.hackThreadsNeeded() * this.percentageStolenPerHackThread();
	}
	hackThreadsNeeded() {
		return Math.floor(
			this.percentageToSteal / this.percentageStolenPerHackThread()
		);
	}
	growThreadsNeeded() {
		return Math.ceil(
			this.cyclesNeededForGrowthCoefficient() / this.serverGrowthPercentage()
		);
	}
	growThreadsNeededAfterTheft() {
		return Math.ceil(
			this.cyclesNeededForGrowthCoefficientAfterTheft() /
				this.serverGrowthPercentage()
		);
	}
	weakenThreadsNeededAfterTheft() {
		return Math.ceil(
			(this.hackThreadsNeeded() * cnt.hackThreadHardening) /
				actualWeakenPotency()
		);
	}
	weakenThreadsNeededAfterGrowth() {
		return Math.ceil(
			(this.growThreadsNeededAfterTheft() * cnt.growthThreadHardening) /
				actualWeakenPotency()
		);
	}
	weakenThreadTotalPerCycle() {
		return (
			this.weakenThreadsNeededAfterTheft() +
			this.weakenThreadsNeededAfterGrowth()
		);
	}
	hasRoot() {
		return this._ns.hasRootAccess(this.name);
	}
	isHost() {
		return this.name == daemonHost;
	}
	getRam() {
		return this._ns.getServerRam(this.name);
	}
	ramAvailable() {
		var ramArray = this.getRam();
		return ramArray[0] - ramArray[1];
	}
	growDelay() {
		return (
			this.timeToWeaken() - this.timeToGrow() + cnt.arbitraryExecutionDelay
		);
	}
	hackDelay() {
		return this.timeToWeaken() - this.timeToHack();
	}

	timeToGrow() {
		return this._ns.getGrowTime(this.name);
	}
	timeToHack() {
		return this._ns.getHackTime(this.name);
	}
	weakenThreadsNeeded() {
		return Math.ceil(
			(this.curSecurity() - this.minSecurity) / actualWeakenPotency()
		);
	}
}
