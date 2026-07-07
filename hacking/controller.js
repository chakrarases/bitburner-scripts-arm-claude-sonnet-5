import { getRootedServers, scanAllServers } from "/utils/network.js";

const MAX_TARGETS = 5;

/** @param {NS} ns */
export async function main(ns) {
	const hackScript = "/hacking/hack.js";
	const growScript = "/hacking/grow.js";
	const weakenScript = "/hacking/weaken.js";

	while (true) {
		const targets = pickTargets(ns, MAX_TARGETS);
		const hosts = getRootedServers(ns).sort((a, b) => freeRamOf(ns, b) - freeRamOf(ns, a));

		if (targets.length === 0 || hosts.length === 0) {
			await ns.sleep(1000);
			continue;
		}

		ns.print(`Targeting: ${targets.join(", ")} across ${hosts.length} host(s)`);

		const assignment = allocateHostsToTargets(ns, hosts, targets);

		const pids = [];
		for (const host of hosts) {
			const target = assignment.get(host);

			const secLevel = ns.getServerSecurityLevel(target);
			const minSecLevel = ns.getServerMinSecurityLevel(target);
			const money = ns.getServerMoneyAvailable(target);
			const maxMoney = ns.getServerMaxMoney(target);

			let script;
			if (secLevel > minSecLevel + 5) {
				script = weakenScript;
			} else if (money < maxMoney * 0.75) {
				script = growScript;
			} else {
				script = hackScript;
			}

			const scriptRam = ns.getScriptRam(script, host);
			const threads = Math.floor(freeRamOf(ns, host) / scriptRam);
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

function pickTargets(ns, maxTargets) {
	const playerHackLevel = ns.getHackingLevel();
	const candidates = scanAllServers(ns).filter(
		(host) =>
			host !== "home" &&
			ns.hasRootAccess(host) &&
			ns.getServerMaxMoney(host) > 0 &&
			ns.getServerRequiredHackingLevel(host) <= playerHackLevel
	);

	candidates.sort((a, b) => scoreTarget(ns, b) - scoreTarget(ns, a));
	return candidates.slice(0, maxTargets);
}

function scoreTarget(ns, target) {
	return ns.getServerMaxMoney(target) / ns.getServerMinSecurityLevel(target);
}

// Weighted round robin: each host goes to whichever target is currently
// furthest below its fair share of allocated RAM (score-weighted), so
// higher-scored targets end up with proportionally more hosts/RAM.
function allocateHostsToTargets(ns, hosts, targets) {
	const scores = targets.map((target) => scoreTarget(ns, target));
	const totalScore = scores.reduce((sum, score) => sum + score, 0);
	const weights = scores.map((score) => score / totalScore);
	const allocatedRam = targets.map(() => 0);

	const assignment = new Map();
	for (const host of hosts) {
		let bestIndex = 0;
		let bestRatio = allocatedRam[0] / weights[0];
		for (let i = 1; i < targets.length; i++) {
			const ratio = allocatedRam[i] / weights[i];
			if (ratio < bestRatio) {
				bestRatio = ratio;
				bestIndex = i;
			}
		}

		assignment.set(host, targets[bestIndex]);
		allocatedRam[bestIndex] += freeRamOf(ns, host);
	}

	return assignment;
}

function freeRamOf(ns, host) {
	return ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
}
