#!/bin/bash
#
# JIRA and GitHub Integration for macOS
# 
# This script runs the JavaScript for Automation (JXA) script that
# retrieves JIRA tickets and GitHub pull requests using API tokens
# stored in the macOS Keychain.
#
# Author: Thomas Vincent
# Version: 3.0.0
# License: MIT
#

# Set colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
JXA_SCRIPT="$SCRIPT_DIR/src/js/JIRAGitHubIntegration.js"

# Display help message
function show_help {
  echo -e "${BLUE}JIRA and GitHub Integration for macOS${NC}"
  echo
  echo -e "This script retrieves JIRA tickets and GitHub pull requests using API tokens"
  echo -e "stored in the macOS Keychain."
  echo
  echo -e "${GREEN}Usage:${NC}"
  echo -e "  $0 [options]"
  echo
  echo -e "${GREEN}Options:${NC}"
  echo -e "  -h, --help                 Show this help message"
  echo -e "  -u, --github-user USER     Specify GitHub username (default: from config)"
  echo -e "  -r, --github-repo REPO     Specify GitHub repository (default: from config)"
  echo -e "  -o, --output-file FILE     Specify output file path (default: ~/Documents/JIRA-GitHub-Data.json)"
  echo -e "  -a, --app APP              Specify application to open output file (default: TextEdit)"
  echo -e "  -n, --no-browser           Don't open tickets/PRs in browser"
  echo -e "  -t, --test                 Run tests instead of the main script"
  echo
  echo -e "${YELLOW}Examples:${NC}"
  echo -e "  $0 --github-user myuser --github-repo myproject"
  echo -e "  $0 --output-file ~/Desktop/tickets.json --app \"Visual Studio Code\""
  echo -e "  $0 --no-browser"
  echo -e "  $0 --test"
  echo
}

# Check if script exists
if [ ! -f "$JXA_SCRIPT" ]; then
  echo -e "${RED}Error: JXA script not found at $JXA_SCRIPT${NC}"
  exit 1
fi

# Parse command line arguments
GITHUB_USER=""
GITHUB_REPO=""
OUTPUT_FILE=""
OUTPUT_APP=""
OPEN_BROWSER=true
RUN_TESTS=false

while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    -h|--help)
      show_help
      exit 0
      ;;
    -u|--github-user)
      GITHUB_USER="$2"
      shift
      shift
      ;;
    -r|--github-repo)
      GITHUB_REPO="$2"
      shift
      shift
      ;;
    -o|--output-file)
      OUTPUT_FILE="$2"
      shift
      shift
      ;;
    -a|--app)
      OUTPUT_APP="$2"
      shift
      shift
      ;;
    -n|--no-browser)
      OPEN_BROWSER=false
      shift
      ;;
    -t|--test)
      RUN_TESTS=true
      shift
      ;;
    *)
      echo -e "${RED}Unknown option: $key${NC}"
      show_help
      exit 1
      ;;
  esac
done

if [ "$RUN_TESTS" = true ]; then
  # Run tests
  echo -e "${GREEN}Running tests...${NC}"
  osascript -l JavaScript "$SCRIPT_DIR/tests/test-integration.js"
  exit $?
fi

# Build the JavaScript parameter string
PARAMS=""
if [ -n "$GITHUB_USER" ]; then
  PARAMS="$PARAMS const options = {};"
  PARAMS="$PARAMS options.githubUsername = '$GITHUB_USER';"
fi

if [ -n "$GITHUB_REPO" ]; then
  if [ -z "$PARAMS" ]; then
    PARAMS="$PARAMS const options = {};"
  fi
  PARAMS="$PARAMS options.githubRepo = '$GITHUB_REPO';"
fi

if [ -n "$OUTPUT_FILE" ]; then
  if [ -z "$PARAMS" ]; then
    PARAMS="$PARAMS const options = {};"
  fi
  PARAMS="$PARAMS options.outputFilePath = '$OUTPUT_FILE';"
fi

if [ -n "$OUTPUT_APP" ]; then
  if [ -z "$PARAMS" ]; then
    PARAMS="$PARAMS const options = {};"
  fi
  PARAMS="$PARAMS options.outputApp = '$OUTPUT_APP';"
fi

if [ "$OPEN_BROWSER" = false ]; then
  if [ -z "$PARAMS" ]; then
    PARAMS="$PARAMS const options = {};"
  fi
  PARAMS="$PARAMS options.openInBrowser = false;"
fi

# If we have parameters, add the main call with options
if [ -n "$PARAMS" ]; then
  PARAMS="$PARAMS main(options);"
fi

echo -e "${GREEN}Running JIRA and GitHub Integration...${NC}"

# Execute the JXA script with parameters if specified
if [ -n "$PARAMS" ]; then
  osascript -l JavaScript -e "$(cat "$JXA_SCRIPT")" -e "$PARAMS"
else
  osascript -l JavaScript "$JXA_SCRIPT"
fi

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}Integration completed successfully!${NC}"
else
  echo -e "${RED}Integration failed with exit code $EXIT_CODE${NC}"
fi

exit $EXIT_CODE