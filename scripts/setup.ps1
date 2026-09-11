# Setup script for Career Ops User Repo
param(
  [Parameter(Mandatory=$true)]
  [string]$CandidateName
)

Write-Host "Initializing Career Ops workspace for $CandidateName..." -ForegroundColor Cyan

if (-not (Test-Path "reference")) {
  New-Item -ItemType Directory -Path "reference" | Out-Null
  Write-Host "[+] Created reference/ directory"
}
if (-not (Test-Path "outputs")) {
  New-Item -ItemType Directory -Path "outputs" | Out-Null
  Write-Host "[+] Created outputs/ directory"
}

Copy-Item "core\reference-templates\writing-rules.md" "reference\writing-rules.md" -Force
Copy-Item "core\schemas\qc-rules.template.json" "reference\qc-rules.json" -Force

Write-Host "Workspace initialized. Please populate reference/profile.json and reference/bullet-library.json." -ForegroundColor Green
