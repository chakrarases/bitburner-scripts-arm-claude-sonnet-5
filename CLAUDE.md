# Bitburner Scripts — Claude Code Context

## What this repo is
Netscript (Bitburner) scripts, version-controlled here. The workflow is: edit/write in this repo with Claude Code → commit → push to GitHub → pull into the live game running in-browser via the existing sync tool. Claude Code's job ends at the git repo — it has no way to reach the running browser session directly, so never assume a change is "live" until it's been synced in through that separate step.

## Netscript version & file format
This repo targets **NS2**, not the older NS1 (`.script`). Every script is a plain `.js` file with an async entry point:

```js
/** @param {NS} ns */
export async function main(ns) {
  // ...
}
```

All game API calls go through the `ns` object passed into `main` — never assume a bare global like `hack()`; it's always `ns.hack()`, `ns.grow()`, `ns.weaken()`, etc.

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

## Fill in for your setup
> These are specific to your repo — Claude, ask if one of these is missing and actually matters for the current task.
- **Folder layout: /hacking, /hacknet, /gang, /corp, /utils
- **Sync tool/command** that pulls committed code into the browser: git-pull.js
- **Plain JS or TypeScript-compiled-to-JS: Plain JS
