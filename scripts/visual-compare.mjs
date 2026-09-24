import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baselineDir =
  process.env.VISUAL_BASELINE_DIR || path.resolve(__dirname, '../tests/visual/baseline');
const currentDir =
  process.env.VISUAL_CURRENT_DIR || path.resolve(__dirname, '../tests/visual/current');
const diffDir = process.env.VISUAL_DIFF_DIR || path.resolve(__dirname, '../tests/visual/diff');
const threshold = Number(process.env.VISUAL_DIFF_THRESHOLD ?? 0.02);

async function loadPng(filePath) {
  const buffer = await readFile(filePath);
  return PNG.sync.read(buffer);
}

async function main() {
  await mkdir(diffDir, { recursive: true });
  const baselineFiles = (await readdir(baselineDir)).filter((name) => name.endsWith('.png'));
  const results = [];

  for (const name of baselineFiles) {
    const baselinePath = path.join(baselineDir, name);
    const currentPath = path.join(currentDir, name);
    let currentExists = true;
    try {
      await readFile(currentPath);
    } catch {
      currentExists = false;
    }
    if (!currentExists) {
      results.push({ screen: name, status: 'missing-current', diffRatio: null });
      continue;
    }

    const baseline = await loadPng(baselinePath);
    const current = await loadPng(currentPath);
    if (baseline.width !== current.width || baseline.height !== current.height) {
      results.push({
        screen: name,
        status: 'size-mismatch',
        diffRatio: null,
        baseline: `${baseline.width}x${baseline.height}`,
        current: `${current.width}x${current.height}`,
      });
      continue;
    }

    const { width, height } = baseline;
    const diff = new PNG({ width, height });
    const mismatchedPixels = pixelmatch(baseline.data, current.data, diff.data, width, height, {
      threshold: 0.1,
    });
    const diffRatio = mismatchedPixels / (width * height);
    const pass = diffRatio <= threshold;
    if (!pass) await writeFile(path.join(diffDir, name), PNG.sync.write(diff));
    results.push({
      screen: name,
      status: pass ? 'pass' : 'fail',
      diffRatio: Number(diffRatio.toFixed(4)),
    });
  }

  const failed = results.filter((result) => result.status !== 'pass');
  console.log(JSON.stringify({ threshold, results }, null, 2));
  if (failed.length > 0) {
    console.error(
      `\n${failed.length} screen(s) failed visual comparison (threshold ${threshold}).`,
    );
    process.exit(1);
  }
  console.log(`\nAll ${results.length} screens within visual diff threshold (${threshold}).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
