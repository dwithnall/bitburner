/** @param {NS} ns **/

const toolScripts = [
	{ weak: { script: "weak-target.js", ram: 0, spreadable: true } },
	{ grow: { script: "grow-target.js", ram: 0, spreadable: true } },
	{ hack: { script: "hack-target.js", ram: 0, spreadable: true } },
	{ host: { script: "host-target.js", ram: 0, spreadable: false } },
	{ node: { script: "node-target.js", ram: 0, spreadable: false } },
	{ tor: { script: "tor-target.js", ram: 0, spreadable: false } },
	{ prog: { script: "program-target.js", ram: 0, spreadable: false } },
	{ agent: { script: "agency-target.js", ram: 0, spreadable: false } },
	{ aug: { script: "aug-target.js", ram: 0, spreadable: false } },
];

export class tool {
	_ns;
	tool;
	ram;
	spreadable;

	constructor(ns, name) {
		this._ns = ns;
		this.tool = toolScripts[name];
		this.ram = this._ns.getScriptRam(tool);
	}

	canRun(server) {
		return (
			doesServerHaveFile(this.instance, this.name, server.name) &&
			server.ramAvailable() >= this.cost
		);
	}

	getMaxThreads() {
		// analyzes the daemon servers array and figures about how many threads can be spooled up across all of them.
		var maxThreads = 0;
		sortServerListByRam();

		for (var i = 0; i < serverListRam.length; i++) {
			var daemonServer = serverListRam[i];
			// you don't count lol
			if (!daemonServer.hasRoot()) continue;

			var threadsHere = Math.floor(daemonServer.ramAvailable() / this.cost);
			if (!tool.spreadable) return threadsHere;

			maxThreads += threadsHere;
		}
		return maxThreads;
	}
}
