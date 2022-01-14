/** @param {NS} ns **/

export const milliseconds = (hrs, min, sec) => {
	return (hrs * 60 * 60 + min * 60 + sec) * 1000;
};

export async const copyFiles = (ns) => {
	if (!ns.fileExists("file-list.txt")) return;

	const fileList = JSON.parse(ns.read("file-list.txt"));

	for (let srv in fileList) {
		ns.tprint(srv);
		let srvFiles = fileList[srv];

		ns.tprint(srvFiles);

		for (let fileIdx in srvFiles) {
			let fileName = srvFiles[fileIdx];

			if (
				fileName.endsWith(".lit") ||
				fileName.endsWith(".script") ||
				fileName.endsWith(".txt")
			) {
				await ns.scp(fileName, srv, "home");
			}
		}
	}
}}
