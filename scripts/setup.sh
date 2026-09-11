#!/usr/bin/env bash
set -e
CANDIDATE_NAME="$1"
if [ -z "$CANDIDATE_NAME" ]; then
  echo "Usage: ./setup.sh \"Candidate Name\""
  exit 1
fi

echo "Initializing Career Ops workspace for $CANDIDATE_NAME..."
mkdir -p reference outputs
cp core/reference-templates/writing-rules.md reference/writing-rules.md
cp core/schemas/qc-rules.template.json reference/qc-rules.json

echo "Workspace initialized. Please populate reference/profile.json and reference/bullet-library.json."
