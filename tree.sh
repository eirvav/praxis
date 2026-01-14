#!/bin/bash

# Tree command to show only relevant files in the repository
# Excludes: node_modules, .next, .git, build artifacts, logs, etc.

# Check if tree command is available
if command -v tree &> /dev/null; then
    tree -I 'node_modules|.next|.git|.vercel|out|build|coverage|.DS_Store|*.log|*.tsbuildinfo|.env*' --dirsfirst | sed '/^[| ]*|   |   |-- .*\.tsx$/d' | sed '/^[| ]*|   |   `-- .*\.tsx$/d' | sed '/^[| ]*|   |   |-- .*\.ts$/d' | sed '/^[| ]*|   |   `-- .*\.ts$/d'
else
    echo "Error: 'tree' command not found."
    echo ""
    echo "Install options:"
    echo "  macOS:   brew install tree"
    echo "  Ubuntu:  sudo apt-get install tree"
    echo "  Windows: choco install tree"
    echo ""
    echo "Or use: npm run tree"
    exit 1
fi

