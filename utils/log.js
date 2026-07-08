function timestamp() {
	const now = new Date();
	const pad = (n) => String(n).padStart(2, "0");
	const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
	const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
	return `${date} ${time}`;
}

/** @param {NS} ns */
export function log(ns, message) {
	ns.print(`${timestamp()} ${message}`);
}
