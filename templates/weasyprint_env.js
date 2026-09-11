'use strict';
const fs = require('fs');
const path = require('path');

/**
 * Simple zero-dependency .env file parser.
 * Reads KEY=VALUE lines, strips quotes, and populates process.env if not already set.
 */
function loadDotEnv(startDir) {
  const templatesDir = __dirname;
  const searchDirs = [
    startDir,
    process.cwd(),
    path.resolve(templatesDir, '..'),
    templatesDir
  ].filter(Boolean);

  const checked = new Set();
  for (const dir of searchDirs) {
    const resolvedDir = path.resolve(dir);
    if (checked.has(resolvedDir)) continue;
    checked.add(resolvedDir);

    const envPath = path.join(resolvedDir, '.env');
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf8');
        for (const line of content.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            let val = trimmed.slice(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (process.env[key] === undefined) {
              process.env[key] = val;
            }
          }
        }
        break;
      } catch (e) {
        console.warn(`Warning: Failed to parse .env at ${envPath}: ${e.message}`);
      }
    }
  }
}

/**
 * Resolves WeasyPrint execution environment without hardcoding absolute paths.
 * Order of precedence:
 *   1. Environment variable WEASYPRINT_DLL_DIRECTORIES
 *   2. Environment variable MSYS_BIN
 *   3. .env file configuration (via loadDotEnv)
 *   4. Dynamic scan along process.env.PATH for GTK/GObject DLLs (libgobject-2.0-0.dll)
 */
function getWeasyPrintEnv(dataRoot) {
  loadDotEnv(dataRoot);

  const templatesDir = __dirname;
  let dllDir = process.env.WEASYPRINT_DLL_DIRECTORIES || process.env.MSYS_BIN || '';

  if (!dllDir && process.env.PATH) {
    // Dynamically search PATH for the directory containing the GTK/GObject DLL required by WeasyPrint
    const candidateDirs = process.env.PATH.split(path.delimiter);
    for (const dir of candidateDirs) {
      if (!dir) continue;
      try {
        if (fs.existsSync(path.join(dir, 'libgobject-2.0-0.dll'))) {
          dllDir = dir;
          break;
        }
      } catch (e) {}
    }
  }

  const venvBin = process.env.VENV_BIN || path.resolve(templatesDir, '..', '.venv', 'Scripts');
  const pythonBin = process.env.PYTHON_BIN || (process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Python', 'bin') : '');

  const pathParts = [];
  if (pythonBin && fs.existsSync(pythonBin)) pathParts.push(pythonBin);
  if (venvBin && fs.existsSync(venvBin)) pathParts.push(venvBin);
  if (dllDir && fs.existsSync(dllDir)) pathParts.push(dllDir);
  pathParts.push(process.env.PATH);

  return Object.assign({}, process.env, {
    ...(dllDir ? { WEASYPRINT_DLL_DIRECTORIES: dllDir } : {}),
    PATH: pathParts.join(path.delimiter)
  });
}

module.exports = {
  loadDotEnv,
  getWeasyPrintEnv
};
