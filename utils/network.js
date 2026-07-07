/** @param {NS} ns */
export function scanAllServers(ns) {
	const visited = new Set();
	const queue = ["home"];

	while (queue.length > 0) {
		const host = queue.shift();
		if (visited.has(host)) continue;
		visited.add(host);

		for (const neighbor of ns.scan(host)) {
			if (!visited.has(neighbor)) queue.push(neighbor);
		}
	}

	return [...visited];
}

/** @param {NS} ns */
export function getRootedServers(ns) {
	return scanAllServers(ns).filter((host) => ns.hasRootAccess(host));
}
