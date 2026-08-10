import { execSync } from 'node:child_process';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const docsDir = join(root, 'docs');
const buildDir = join(docsDir, 'mkdocs-temp');
const buildDocsDir = join(buildDir, 'docs');
const siteDir = join(docsDir, 'site');
const venvDir = join(root, '.venv-docs');
const mkdocsBin = process.platform === 'win32' ? join(venvDir, 'Scripts', 'mkdocs.exe') : join(venvDir, 'bin', 'mkdocs');

async function ensureVenv() {
  const entries = await readdir(venvDir).catch(() => []);
  if (entries.length === 0) {
    console.log('Creating Python venv for MkDocs...');
    execSync(`python3 -m venv "${venvDir}"`, { stdio: 'inherit', cwd: root });
  }

  try {
    execSync(`"${mkdocsBin}" --version`, { stdio: 'pipe' });
  } catch {
    console.log('Installing MkDocs + Material...');
    const pip = process.platform === 'win32' ? join(venvDir, 'Scripts', 'pip.exe') : join(venvDir, 'bin', 'pip');
    execSync(`"${pip}" install -q mkdocs mkdocs-material`, { stdio: 'inherit', cwd: root });
  }
}

async function copyDir(src, dest) {
  await mkdir(dest, { recursive: true });
  const entries = await readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await cp(srcPath, destPath);
    }
  }
}

async function cleanDir(dir) {
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
}

async function buildApiDocs() {
  console.log('Generating API docs with TypeDoc...');
  execSync('npx typedoc --out docs/api --entryPointStrategy expand src --exclude "**/*.test.ts" --exclude "**/*.test.tsx"', {
    stdio: 'inherit',
    cwd: root,
  });
}

async function buildSchemaDocs() {
  console.log('Generating schema docs...');
  execSync('npx tsx scripts/generateSchemaDocs.ts', { stdio: 'inherit', cwd: root });
}

async function buildAssetCatalog() {
  console.log('Generating asset catalog...');
  execSync('npx tsx scripts/generateAssetCatalog.ts', { stdio: 'inherit', cwd: root });
}

async function prepareMkDocsBuildDir() {
  await cleanDir(buildDir);
  await mkdir(buildDocsDir, { recursive: true });

  // Top-level docs from repo root and docs folder.
  const indexContent = await readFile(join(docsDir, 'README.md'), 'utf-8');
  await writeFile(join(buildDocsDir, 'index.md'), indexContent, 'utf-8');
  await cp(join(root, 'AGENTS.md'), join(buildDocsDir, 'agents.md'));
  await cp(join(root, 'CONTRIBUTING.md'), join(buildDocsDir, 'contributing.md'));
  await cp(
    join(docsDir, 'specs', 'GIZA - 99 Development Playbook.md'),
    join(buildDocsDir, 'playbook.md'),
  );

  // Sub-doc trees.
  for (const subdir of ['architecture', 'adr', 'governance']) {
    const src = join(docsDir, subdir);
    const dest = join(buildDocsDir, subdir);
    await copyDir(src, dest).catch(() => {
      console.warn(`Could not copy docs/${subdir}; skipping.`);
    });
  }

  // Generated API and schema reference.
  await copyDir(join(docsDir, 'api'), join(buildDocsDir, 'api'));
  await copyDir(join(docsDir, 'schema'), join(buildDocsDir, 'schema'));

  // A reference landing page links the static TypeDoc output and schema docs.
  await writeFile(
    join(buildDocsDir, 'reference.md'),
    '# Reference\n\n- [API Reference](api/index.html)\n- [Schema Reference](schema/index.md)\n',
    'utf-8',
  );

  // MkDocs configuration.
  const mkdocsYml = `site_name: GIZA Documentation
site_dir: ../site
docs_dir: docs

theme:
  name: material
`;
  await writeFile(join(buildDir, 'mkdocs.yml'), mkdocsYml, 'utf-8');
}

async function buildSite() {
  console.log('Building static site with MkDocs...');
  execSync(`"${mkdocsBin}" build -f "${join(buildDir, 'mkdocs.yml')}"`, {
    stdio: 'inherit',
    cwd: root,
  });
}

async function main() {
  await ensureVenv();
  await buildApiDocs();
  await buildSchemaDocs();
  await buildAssetCatalog();
  await prepareMkDocsBuildDir();
  await buildSite();
  console.log(`Documentation generated in ${siteDir}`);
}

main().catch((error) => {
  console.error('Documentation generation failed:', error.message);
  process.exit(1);
});
