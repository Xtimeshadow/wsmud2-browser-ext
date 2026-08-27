#!/bin/bash
set -e

cd "$(dirname "$0")/wsmud2-browser-ext"

VERSION=$(node -p "require('./manifest.json').version")
OUTPUT_NAME="wsmud2-browser-ext-${VERSION}.zip"

echo "Building ${OUTPUT_NAME}..."

zip -r "../${OUTPUT_NAME}" . \
  -x "*.zip" \
  -x ".git/*" \
  -x "*.gitignore" \
  -x "node_modules/*" \
  -x "*.log"

echo "Done! Output: ${OUTPUT_NAME}"