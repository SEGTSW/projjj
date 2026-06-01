import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const forbidden = [
  ['ev', 'al('].join(''),
  ['new ', 'Function('].join(''),
  ['localStorage.', 'setItem("password"'].join(''),
  ['fetch("', 'http'].join('')
];
const roots = ['src', 'tests', 'scripts'];
const issues = [];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return walk(path);
    }
    return path.endsWith('.js') || path.endsWith('.jsx') || path.endsWith('.mjs') ? [path] : [];
  }));
  return files.flat();
}

for (const root of roots) {
  for (const file of await walk(root)) {
    const source = await readFile(file, 'utf8');
    forbidden.forEach((pattern) => {
      if (source.includes(pattern)) {
        issues.push(`${file}: forbidden pattern ${pattern}`);
      }
    });
  }
}

if (issues.length > 0) {
  console.error(issues.join('\n'));
  process.exit(1);
}

console.log('Static check passed');
