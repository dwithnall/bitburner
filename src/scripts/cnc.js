import {
	cleanServers,
	remoteExecute,
	killRunningScripts,
} from "/scripts/lib/tools.js";

import { scripts } from "/scripts/lib/constants.js";

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
			await ns.run("/scripts/pwn-found.js");
			break;
		case "kill":
			await killRunningScripts(ns, target);
			break;
		case "hacknodes":
			await ns.run("/scripts/hacknodes.js");
			break;
		default:
			ns.tprint("Invalid action");
			break;
	}
}
