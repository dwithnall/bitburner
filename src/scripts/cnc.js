import { remoteExecute } from "/scripts/lib/execute.js";
import { cleanServers, killRunningScripts } from "/scripts/lib/clean.js";
import { scripts } from "/scripts/lib/constants.js";
import { printSeverStats } from "/scripts/lib/tools.js";

export async function main(ns) {
	const action = ns.args[0];
	const target = ns.args[1];
	const funcArgs = ns.args.slice(2);

	switch (action) {
		case "clean":
			await cleanServers(ns, target);
			break;
		case "spider":
			await ns.run("/scripts/spider.js");
			break;
		case "exec":
			const execServer = target;
			const scriptName = funcArgs[0];
			const targetServer = funcArgs[1];

			if (!(scriptName in scripts)) {
				ns.tprint(`Invalid Script ${scriptName}`);
				return;
			}
			const scriptFile = scripts[scriptName].file;

			await remoteExecute(ns, execServer, scriptFile, targetServer);
			break;
		case "pwnfound":
			const processAll = target !== "all" ? "" : "all";
			await ns.run("/scripts/pwn-found.js", 1, processAll);
			break;
		case "kill":
			await killRunningScripts(ns, target);
			break;
		case "srvstat":
			printSeverStats(ns, target);
			break;
		case "hacknodes":
			await ns.run("/scripts/hacknodes.js");
			break;
		default:
			ns.tprint("Invalid action!");
			ns.tprint("clean [all | target]");
			ns.tprint("spider");
			ns.tprint("exec [all | target] [script] [self | target]");
			ns.tprint("pwnfound");
			ns.tprint("kill [all | target]");
			ns.tprint("srvstat [target]");
			ns.tprint("hacknodes");
			break;
	}
}
