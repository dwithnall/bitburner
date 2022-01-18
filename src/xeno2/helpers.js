// some ancillary scripts that run asynchronously, we utilize the startup/execute capabilities of this daemon to run when able

export const helperScriptNames = [
	"host",
	"node",
	"tor",
	"program",
	"ram",
	"agency",
	"aug",
];

export const buildHelpers = (ns) => {
	let scripts = [];

	helperScriptNames.forEach((s) => {
		const path = `/xeno/${s}-manager.js`;

		scripts.push({
			path: path,
			shortName: s,
			isLaunched: false,
			cost: ns.getScriptRam(path),
		});
	});
	return scripts;
};
