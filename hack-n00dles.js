/** @param {NS} ns */
export async function main(ns) {
	const target = "n00dles";

	while (true) {
		const secLevel = ns.getServerSecurityLevel(target);
		const minSecLevel = ns.getServerMinSecurityLevel(target);
		const money = ns.getServerMoneyAvailable(target);
		const maxMoney = ns.getServerMaxMoney(target);

		ns.print(`Security: ${secLevel.toFixed(2)} / min ${minSecLevel.toFixed(2)} | Money: $${ns.formatNumber(money)} / $${ns.formatNumber(maxMoney)}`);

		if (secLevel > minSecLevel + 5) {
			await ns.weaken(target);
		} else if (money < maxMoney * 0.75) {
			await ns.grow(target);
		} else {
			await ns.hack(target);
		}
	}
}
