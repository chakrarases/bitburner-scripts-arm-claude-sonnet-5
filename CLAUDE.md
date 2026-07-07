# Bitburner Scripts — Claude Code Context

## What this repo is
Netscript (Bitburner) scripts, version-controlled here. The workflow is: edit/write in this repo with Claude Code → commit → push to GitHub → pull into the live game running in-browser via the existing sync tool. Claude Code's job ends at the git repo — it has no way to reach the running browser session directly, so never assume a change is "live" until it's been synced in through that separate step.

## Netscript version & file format
Game version: **3.0.x** (a large breaking-change pass landed in 3.0.0, plus one more small break in 3.0.1 — see the version-specific section below before assuming any `ns.*` name from memory or older guides). NS1 (`.script`) isn't just discouraged anymore — those files **no longer run at all** as of 3.0.0. Every script is a plain `.js` file with an async entry point:

```js
/** @param {NS} ns */
export async function main(ns) {
  // ...
}
```

All game API calls go through the `ns` object passed into `main` — never assume a bare global like `hack()`; it's always `ns.hack()`, `ns.grow()`, `ns.weaken()`, etc.

## API changes from the 3.0.0 breaking-change pass
If a script throws `Function removed in 3.0.0` (or similar) at runtime, it's almost always one of these renames — check here before guessing a fix:

| Old (pre-3.0, will error now) | New (3.0.0+) |
|---|---|
| `ns.formatNumber()` / `ns.nFormat()` | `ns.format.number()` |
| `ns.formatRam()` | `ns.format.ram()` |
| `ns.formatPercent()` | `ns.format.percent()` |
| `ns.tFormat()` | `ns.format.time()` |
| `ns.tail()` | `ns.ui.openTail()` |
| `ns.moveTail()` | `ns.ui.moveTail()` |
| `ns.resizeTail()` | `ns.ui.resizeTail()` |
| `ns.closeTail()` | `ns.ui.closeTail()` |
| `ns.setTitle()` | `ns.ui.setTailTitle()` |
| `ns.getTimeSinceLastAug()` | `Date.now() - ns.getResetInfo().lastAugReset` |
| `ns.getPlayer().bitNodeN` | `ns.getResetInfo().currentNode` |
| `ns.corporation.getCorporation().state` | `ns.corporation.getCorporation().nextState` |
| `ns.corporation.setAutoJobAssignment()` | `ns.corporation.setJobAssignment()` |

Two **behavioral** changes that won't throw a "removed" error but will silently misbehave, so they're easy to miss:
- **Port openers no longer throw on failure.** `ns.brutessh()`, `ns.ftpcrack()`, `ns.relaysmtp()`, `ns.httpworm()`, `ns.sqlinject()`, `ns.nuke()` used to throw if you lacked the right `.exe` or enough open ports; now they just return a value instead. Any script using try/catch around these to detect failure needs to check the return value instead — easy to trip over in exactly the hack/nuke scripts this repo is full of.
- **No more fuzzy string matching** on enum-like params (crime names, Bladeburner actions, faction work types, university classes, gym stats, job fields, stock position/order types). `"rob store"` used to work for `ns.singularity.commitCrime`; it must now be the exact string, e.g. `"Rob Store"`. Only bites once Singularity/Bladeburner/Corp scripts show up here.

v3.0.1 added one further break on top of 3.0.0: `ns.getServer()`'s return shape changed and `getServerAuthDetails` was renamed — flag either if you see them in older code.

**Fastest way to audit an existing script for breaks:** the game auto-generates `APIBreakInfo-3.0.0.txt` on the home server listing everything it flagged. If that file's contents get pasted or uploaded here, treat it as the source of truth over this table.

## The rule that matters most: RAM cost
Every `ns.*` function a script *references* adds to its static RAM cost — even if that call sits in a branch that never runs at runtime. RAM is computed by static analysis of the code, not by tracing execution. This directly caps how many threads fit on a given server, so it's the main design constraint in this codebase.

Conventions to follow:
- Keep single-purpose worker scripts (`hack.js`, `grow.js`, `weaken.js`, ...) as lean as possible — only reference the `ns` functions that specific script actually needs.
- Keep orchestration (choosing targets, spawning workers, budgeting RAM) in separate controller scripts, not mixed into cheap workers.
- If a change adds a new `ns.*` call to an existing worker script, say so explicitly — that's a RAM cost increase, not a free refactor.
- Prefer `ns.exec(script, host, threads, ...args)` with explicit thread counts for parallelism, over one script looping internally.

## Other patterns used here
- Network discovery via recursive `ns.scan()`.
- Cross-script signaling via ports (`ns.writePort` / `ns.tryWritePort` / `ns.readPort`).
- `ns.getServerMaxRam()` / `ns.getServerUsedRam()` in controllers before calling `ns.exec()`, to avoid overshooting a server's RAM.
- Any polling/loop always `await ns.sleep(...)` — a tight loop without yielding can freeze the game's UI thread, not just the script.

## Workflow rules for Claude Code
1. Show the diff and a rough RAM-cost estimate for any new/changed script before I decide thread counts.
2. `node --check path/to/script.js` is a fine quick JS-syntax sanity check, but it doesn't validate against the real Bitburner `ns` API — it can't catch a typo'd function name.
3. Don't commit or push on your own initiative — write the code, wait for me to explicitly say "commit and push."
4. Always use the 3.0.0+ API names from the table above (`ns.format.*`, `ns.ui.*`, `ns.getResetInfo()`, ...) — never suggest a pre-3.0 flat name like `ns.formatNumber()` or `ns.tail()`, even if it looks familiar from older guides or training data.

## Fill in for your setup
> These are specific to your repo — Claude, ask if one of these is missing and actually matters for the current task.
- **Folder layout: /hacking, /hacknet, /gang, /corp, /sleeve, /stock, /bitrunner, /gamego, /singularity, /utils, etc. (I will specific more when I can unlock new bitnode.)
- **Sync tool/command** that pulls committed code into the browser: git-pull.js
- **Plain JS or TypeScript-compiled-to-JS: Plain JS
