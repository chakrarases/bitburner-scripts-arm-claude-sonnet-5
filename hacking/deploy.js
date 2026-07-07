/** @param {NS} ns */
export async function main(ns) {
	const workerScripts = ["/hacking/hack.js", "/hacking/grow.js", "/hacking/weaken.js"];
	const visited = new Set();
	const queue = ["home"];
	const rooted = [];

	while (queue.length > 0) {
		const host = queue.shift();
		if (visited.has(host)) continue;
		visited.add(host);

		for (const neighbor of ns.scan(host)) {
			if (!visited.has(neighbor)) queue.push(neighbor);
		}

		if (host === "home") continue;

		if (!ns.hasRootAccess(host)) {
			tryRoot(ns, host);
		}

		if (ns.hasRootAccess(host)) {
			rooted.push(host);
			await ns.scp(workerScripts, host, "home");
		}
	}

	ns.tprint(`Rooted and deployed workers to ${rooted.length} server(s): ${rooted.join(", ") || "(none)"}`);
}

function tryRoot(ns, host) {
	if (ns.fileExists("BruteSSH.exe", "home")) ns.brutessh(host);
	if (ns.fileExists("FTPCrack.exe", "home")) ns.ftpcrack(host);
	if (ns.fileExists("relaySMTP.exe", "home")) ns.relaysmtp(host);
	if (ns.fileExists("HTTPWorm.exe", "home")) ns.httpworm(host);
	if (ns.fileExists("SQLInject.exe", "home")) ns.sqlinject(host);
	ns.nuke(host);
}
