import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { SvgCodec } from '../src/infrastructure/SvgCodec.ts';
import { ShapeFactory } from '../src/domain/ShapeFactory.ts';

const source = resolve('src/cli/Main.ts');

test('CLI replays the assignment flowchart, writes browser-readable SVG and reads it back', () => {
  const directory = mkdtempSync(join(tmpdir(), 'svg-cli-'));
  try {
    const file = join(directory, 'flowchart.svg');
    const input = readFileSync('examples/flowchart.commands', 'utf8').replace('save examples/flowchart.svg', `save "${file}"`) + `\nread "${file}"\ntree\n`;
    const result = spawnSync(process.execPath, ['--experimental-strip-types', source], { input, encoding: 'utf8', cwd: directory });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.doesNotMatch(result.stdout, /error:/);
    assert.match(result.stdout, /saved to .* \(8 elements\)/);
    const doc = new SvgCodec(new ShapeFactory()).decode(readFileSync(file, 'utf8')).document;
    assert.equal(doc.all().length, 8);
    assert.equal(doc.require('process').getAttributes().y, '100');
    assert.equal(doc.require('process-label').getText(), '处理数据 v2');
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('batch errors return nonzero after processing remaining commands, with one-line errors', () => {
  const result = spawnSync(process.execPath, ['--experimental-strip-types', source], {
    input: 'init\ncreate circle c 1 2 3\nmove absent 1 2\nmove c NaN 3\nshow c\n', encoding: 'utf8',
  });
  assert.equal(result.status, 1);
  assert.equal(result.stdout.split('\n').filter(line => line.startsWith('error:')).length, 2);
  assert.match(result.stdout, /circle#c  parent=svg/);
  assert.match(result.stdout, /cx=1/);
});

test('compiled CLI runs without TypeScript stripping', () => {
  assert.ok(existsSync('dist/cli/Main.js'), 'run npm run build before the full test suite');
  const result = spawnSync(process.execPath, ['dist/cli/Main.js'], { input: 'init 25 30\ncanvas\n', encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /canvas 25x30/);
});
