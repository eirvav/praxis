#!/bin/bash

# Git push script
# Usage: ./git-push.sh "Your commit message"

# Check if commit message is provided
if [ -z "$1" ]; then
	echo "Error: Commit message is required"
	echo "Usage: ./git-push.sh \"Your commit message\""
	exit 1
fi

COMMIT_MESSAGE="$1"

# Add all changes
echo "Adding all changes..."
git add .

# Check if there are any changes to commit
if git diff --staged --quiet; then
	echo "No changes to commit"
	exit 0
fi

# Commit with message
echo "Committing changes with message: $COMMIT_MESSAGE"
git commit -m "$COMMIT_MESSAGE"

# Check if commit was successful
if [ $? -ne 0 ]; then
	echo "Error: Commit failed"
	exit 1
fi

# Push to remote
echo "Pushing to remote..."
git push

# Check if push was successful
if [ $? -ne 0 ]; then
	echo "Error: Push failed"
	exit 1
fi

echo "Successfully pushed to GitHub!"

