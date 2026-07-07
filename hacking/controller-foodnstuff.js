import { getRootedServers } from "/utils/network.js";

/** @param {NS} ns */
export async function main(ns) {
	const target = "foodnstuff";
	const hackScript = "/hacking/hack.js";
	const growScript = "/hacking/grow.js";
	const weakenScript = "/hacking/weaken.js";

	while (true) {
		const secLevel = ns.getServerSecurityLevel(target);
		const minSecLevel = ns.getServerMinSecurityLevel(target);
		const money = ns.getServerMoneyAvailable(target);
		const maxMoney = ns.getServerMaxMoney(target);

		ns.print(`Security: ${secLevel.toFixed(2)} / min ${minSecLevel.toFixed(2)} | Money: $${ns.format.number(money)} / $${ns.format.number(maxMoney)}`);

		let script;
		if (secLevel > minSecLevel + 5) {
			script = weakenScript;
		} else if (money < maxMoney * 0.75) {
			script = growScript;
		} else {
			script = hackScript;
		}

		const pids = [];
		for (const host of getRootedServers(ns)) {
			const scriptRam = ns.getScriptRam(script, host);
			const freeRam = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
			const threads = Math.floor(freeRam / scriptRam);
			if (threads < 1) continue;

			const pid = ns.exec(script, host, threads, target);
			if (pid !== 0) pids.push(pid);
		}

		if (pids.length === 0) {
			await ns.sleep(1000);
			continue;
		}

		while (pids.some((pid) => ns.isRunning(pid))) {
			await ns.sleep(200);
		}
	}
}
