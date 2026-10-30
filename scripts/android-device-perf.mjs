#!/usr/bin/env node
/**
 * Local physical-device performance capture. No telemetry, uploads, or private HQ data.
 * Requirements: Node 20+, Android platform-tools (adb), installed native debug APK.
 *
 * Run: node scripts/android-device-perf.mjs
 * Optional: node scripts/android-device-perf.mjs --serial SERIAL --hz 60
 * Parser regression: node scripts/android-device-perf.mjs --self-test
 *
 * Force-stop relaunch is NOT a true first-install cold-start benchmark. gfxinfo
 * estimates UI frame completion, not display FPS or end-to-end touch latency.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';

const PACKAGE = 'com.cheeselouise.romantiverse';
const ACTIVITY = PACKAGE + '/.MainActivity';

export function parseLaunch(text) {
  if (!/Status:\s*ok\b/i.test(text)) return null;
  const match = text.match(/TotalTime:\s*(\d+)/);
  return match ? Number(match[1]) : null;
}

export function parseFrames(text) {
  // Android's framestats CSV contains one record per UI frame.
  // Use named columns rather than relying on a fixed Android-version index.
  const lines = text.split(/\r?\n/).map(s => s.trim());
  const header = lines.find(s => s.startsWith('Flags,IntendedVsync,') && s.includes('FrameCompleted'));
  if (!header) return [];
  const names = header.split(',');
  const flags = names.indexOf('Flags');
  const intended = names.indexOf('IntendedVsync');
  const completed = names.indexOf('FrameCompleted');
  const result = [];
  for (const line of lines.slice(lines.indexOf(header) + 1)) {
    if (!/^\d+,/.test(line)) continue;
    const cells = line.split(',');
    if (cells.length < names.length || Number(cells[flags]) !== 0) continue;
    const a = Number(cells[intended]);
    const b = Number(cells[completed]);
    const ms = (b - a) / 1e6;
    if (Number.isFinite(ms) && ms > 0 && ms < 5000) result.push(ms);
  }
  return result;
}

export function summarize(frames, hz = 60) {
  if (!frames.length) return null;
  const sorted = [...frames].sort((a, b) => a - b);
  const percentile = p => sorted[Math.ceil(p * sorted.length) - 1];
  const budget = 1000 / hz;
  return {
    frames: sorted.length,
    targetHz: hz,
    budgetMs: Number(budget.toFixed(2)),
    medianMs: Number(percentile(.5).toFixed(2)),
    p90Ms: Number(percentile(.9).toFixed(2)),
    p95Ms: Number(percentile(.95).toFixed(2)),
    p99Ms: Number(percentile(.99).toFixed(2)),
    overBudget: sorted.filter(ms => ms > budget).length,
    overTwoBudgets: sorted.filter(ms => ms > 2 * budget).length,
    overBudgetPercent: Number((100 * sorted.filter(ms => ms > budget).length / sorted.length).toFixed(2))
  };
}

function selfTest() {
  assert.equal(parseLaunch('Status: ok\nTotalTime: 273\nWaitTime: 300'), 273);
  assert.equal(parseLaunch('Status: error\nTotalTime: 273'), null);
  const csv = [
    '---PROFILEDATA---',
    'Flags,IntendedVsync,Vsync,FrameCompleted,DequeueBufferDuration',
    '0,1000000000,1000000001,1010000000,0',
    '0,2000000000,2000000001,2040000000,0',
    '1,3000000000,3000000001,3040000000,0',
    '---PROFILEDATA---'
  ].join('\n');
  assert.deepEqual(parseFrames(csv), [10, 40]);
  assert.equal(summarize([10, 40], 60).overBudget, 1);
  assert.equal(summarize([], 60), null);
  console.log('Device-performance parser self-test passed');
}

function adb(args, serial) {
  const argv = serial ? ['-s', serial, ...args] : args;
  return execFileSync('adb', argv, { encoding: 'utf8', timeout: 30000, maxBuffer: 8 * 1024 * 1024 });
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--self-test')) { selfTest(); return; }
  const option = name => {
    const index = args.indexOf(name);
    return index >= 0 ? args[index + 1] : undefined;
  };
  const hz = Number(option('--hz') ?? '60');
  assert.ok(Number.isFinite(hz) && hz >= 30 && hz <= 240, 'Choose --hz 60, 90, 120, etc.');
  const online = adb(['devices']).split(/\r?\n/)
    .map(line => line.match(/^([^\s]+)\s+device$/)?.[1]).filter(Boolean);
  const serial = option('--serial') ?? (online.length === 1 ? online[0] : null);
  assert.ok(serial && online.includes(serial), 'Connect exactly one authorized device or supply --serial SERIAL');
  const shell = (...cmd) => adb(['shell', ...cmd], serial);
  const installed = shell('pm', 'path', PACKAGE);
  assert.ok(installed.includes('package:'), 'Install the native APK before testing');
  const model = shell('getprop', 'ro.product.model').trim();
  const android = shell('getprop', 'ro.build.version.release').trim();
  const emulator = shell('getprop', 'ro.kernel.qemu').trim() === '1';
  if (emulator) console.warn('WARNING: emulator results do not validate physical Samsung performance');
  const launches = [];
  for (let i = 0; i < 5; i++) {
    shell('am', 'force-stop', PACKAGE);
    const result = shell('am', 'start', '-W', '-n', ACTIVITY);
    const duration = parseLaunch(result);
    assert.ok(duration !== null, 'Activity launch failed: ' + result);
    launches.push(duration);
  }
  // Do not include the startup frames in the interactive game-play sample.
  shell('dumpsys', 'gfxinfo', PACKAGE, 'reset');
  console.log('On ' + model + ': play for at least 60 seconds. Mark/unmark squares,');
  console.log('complete a Bingo, scroll posters, navigate tabs and open Together.');
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try { await rl.question('Press Enter AFTER interacting to capture frames and memory... '); }
  finally { rl.close(); }
  const frames = parseFrames(shell('dumpsys', 'gfxinfo', PACKAGE, 'framestats'));
  const meminfo = shell('dumpsys', 'meminfo', PACKAGE);
  const pss = meminfo.match(/TOTAL PSS:\s*(\d+)/);
  const report = {
    capturedAt: new Date().toISOString(), deviceModel: model, androidVersion: android,
    emulator, targetHz: hz,
    relaunchTotalMs: launches, relaunchMedianMs: [...launches].sort((a, b) => a - b)[2],
    gameplayFrames: summarize(frames, hz),
    totalPssKb: pss ? Number(pss[1]) : null,
    notes: 'Force-stop relaunches are not first-install cold starts. Framestats are UI completion estimates; inspect interaction scenarios separately. No automatic launch approval.'
  };
  writeFileSync('android-device-performance.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
  if (!frames.length) {
    console.error('No usable frame records: gameplay performance NOT validated.');
    process.exitCode = 2;
  } else {
    console.log('Saved android-device-performance.json locally; no data uploaded.');
  }
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
