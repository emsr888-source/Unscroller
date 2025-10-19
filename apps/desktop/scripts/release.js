#!/usr/bin/env node
/**
 * Build and package the desktop app for the current platform, and optionally
 * produce Dev mode artifacts. Skips unsupported targets gracefully so the same
 * script can run on macOS, Windows, or Linux.
 */
const { spawnSync } = require('child_process');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    stdio: 'inherit',
    env: { ...process.env, ...options.env },
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }
}

function tryRun(command, args, options = {}) {
  try {
    run(command, args, options);
    return true;
  } catch (error) {
    console.warn(`[release] Skipped ${command} ${args.join(' ')}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('[release] Cleaning previous artifacts…');
  run('npm', ['run', 'clean']);

  console.log('[release] Building desktop app…');
  run('npm', ['run', 'build']);

  console.log('[release] Creating dev unpacked build…');
  tryRun('npm', ['run', 'package:dev']);

  const platform = process.platform;
  if (platform === 'darwin') {
    console.log('[release] Packaging macOS dmg/zip…');
    run('npm', ['run', 'package:mac']);

    console.log('[release] Attempting Windows installer build (requires wine)…');
    tryRun('npm', ['run', 'package:win'], {
      env: { CSC_IDENTITY_AUTO_DISCOVERY: 'false' },
    });
  } else if (platform === 'win32') {
    console.log('[release] Packaging Windows installer…');
    run('npm', ['run', 'package:win']);
  } else if (platform === 'linux') {
    console.log('[release] Packaging Linux AppImage…');
    run('npm', ['run', 'package:linux']);
  } else {
    console.warn(`[release] Unsupported platform "${platform}". Skipping platform-specific packaging.`);
  }

  console.log('[release] Build complete.');
}

main().catch(error => {
  console.error('[release] Build failed:', error.message);
  process.exit(1);
});
