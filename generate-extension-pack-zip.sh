#!/bin/bash

OUTPUT="gmail-shortcuts-plus-extension.zip"

# Ensure extension folder exists
if [[ ! -d "extension" ]]; then
    echo "Error: extension folder not found."
    exit 1
fi

cd extension || exit 1

# Check required files
FILES=(
    "content.js"
    "icon48.png"
    "icon128.png"
    "manifest.json"
    "popup.html"
    "popup.js"
)

for file in "${FILES[@]}"; do
    if [[ ! -f "$file" ]]; then
        echo "Error: $file does not exist."
        exit 1
    fi
done

# Remove old zip if exists
rm -f "../$OUTPUT"

# Create zip with direct files (no folder)
zip -r "../$OUTPUT" "${FILES[@]}"

echo "Created $OUTPUT with direct files!"
