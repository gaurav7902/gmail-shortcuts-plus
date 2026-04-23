#!/bin/bash

# Name of the output zip file
OUTPUT="gmail-helper-extension.zip"

# List of files to include in the zip
FILES=(
    "extension/content.js"
    "extension/icon.png"
    "extension/manifest.json"
    "extension/popup.html"
    "extension/popup.js"
)

# Check if files exist
for file in "${FILES[@]}"; do
    if [[ ! -f "$file" ]]; then
        echo "Error: $file does not exist."
        exit 1
    fi
done

# Create the zip
zip -r "$OUTPUT" "${FILES[@]}"

echo "Created $OUTPUT successfully!"