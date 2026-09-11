'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const outputDir = process.cwd();
const configPath = path.join(outputDir, 'config.json');
const templatesDir = path.resolve(__dirname);
const engine = require(path.join(templatesDir, 'engine.js'));
const rawConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const C = engine.validateConfig(rawConfig);
const { generateHTML } = require(path.join(templatesDir, 'cv_weasyprint_template.js'));
const htmlContent = generateHTML(C);
const htmlPath = path.join(outputDir, 'qc_check.html');
fs.writeFileSync(htmlPath, htmlContent);

const tmpPdfPath = path.join(require('os').tmpdir(), `qc_${Date.now()}.pdf`);
const msysBin = process.env.MSYS_BIN || path.join(process.env.SystemDrive || 'C:', 'msys64', 'mingw64', 'bin');
const venvBin = process.env.VENV_BIN || path.resolve(templatesDir, '..', '.venv', 'Scripts');
const pythonBin = process.env.PYTHON_BIN || (process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Python', 'bin') : '');
const env = Object.assign({}, process.env, { 
  WEASYPRINT_DLL_DIRECTORIES: msysBin,
  PATH: `${pythonBin};${venvBin};${process.env.PATH}`
});

execSync(`python -m weasyprint "${htmlPath}" "${tmpPdfPath}"`, { env, stdio: 'pipe' });
const pdfSize = fs.statSync(tmpPdfPath).size;
const pdfReader = execSync(`python -c "from PyPDF2 import PdfReader; print(len(PdfReader(r'${tmpPdfPath.replace(/\\/g, '\\\\')}').pages))"`, { env, encoding: 'utf8' }).trim();
const pageCount = parseInt(pdfReader);

const { runCoreChecks } = require(path.join(templatesDir, 'qc_core_checks.js'));
const results = runCoreChecks(C, htmlContent, pageCount, tmpPdfPath, pdfSize).slice(0, 10);

const passCount = results.filter(r => r.pass).length;
console.log(`\nQC 10 Checks Summary: ${passCount}/${results.length} passed.`);
try { fs.unlinkSync(htmlPath); } catch (e) {}
try { fs.unlinkSync(tmpPdfPath); } catch (e) {}

if (passCount < results.length) {
  process.exit(1);
}
