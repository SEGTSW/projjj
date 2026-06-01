import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

await mkdir('reports', { recursive: true });
await mkdir('coverage', { recursive: true });

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} failed with ${code}`));
    });
  });
}

await run('npx', [
  'c8',
  '--all',
  '--src=src',
  '--include=src/**/*.js',
  '--exclude=src/main.jsx',
  '--exclude=src/App.jsx',
  '--reporter=lcov',
  '--reporter=html',
  '--reporter=cobertura',
  '--check-coverage',
  '--lines=70',
  '--functions=70',
  '--branches=70',
  '--statements=70',
  'node',
  '--test',
  '--test-reporter=spec',
  '--test-reporter=junit',
  '--test-reporter-destination=stdout',
  '--test-reporter-destination=reports/junit.xml',
  'tests/*.test.js'
]);

const junit = await readFile('reports/junit.xml', 'utf8');
const testCases = [...junit.matchAll(/<testcase\b([^>]*)\/?>/g)].map((match) => {
  const attributes = match[1];
  const name = attributes.match(/\bname="([^"]*)"/)?.[1] ?? 'node-test';
  const time = Number(attributes.match(/\btime="([^"]*)"/)?.[1] ?? 0);
  return { name, duration: Math.round(time * 1000) };
});

const escapeXml = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const sonarReport = `<?xml version="1.0" encoding="UTF-8"?>
<testExecutions version="1">
  <file path="tests/event-planner.test.js">
${testCases.map((testCase) => `    <testCase name="${escapeXml(testCase.name)}" duration="${testCase.duration}"/>`).join('\n')}
  </file>
</testExecutions>
`;

await writeFile('reports/sonar-test-report.xml', sonarReport);
await copyFile('coverage/cobertura-coverage.xml', 'coverage/coverage.xml');
console.log(`Reports generated: ${testCases.length} tests, LCOV, Cobertura XML and HTML coverage.`);
