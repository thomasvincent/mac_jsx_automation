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
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
JXA_SCRIPT="$SCRIPT_DIR/src/js/JIRAGitHubIntegration.js"
CONFIG_DIR="$HOME/.config/jira-github-integration"
CONFIG_FILE="$CONFIG_DIR/config.json"

# Display help message
function show_help {
  echo -e "${BLUE}${BOLD}JIRA and GitHub Integration for macOS${NC}"
  echo
  echo -e "This script retrieves JIRA tickets and GitHub pull requests using API tokens"
  echo -e "stored in the macOS Keychain."
  echo
  echo -e "${GREEN}${BOLD}Usage:${NC}"
  echo -e "  $0 [options]"
  echo
  echo -e "${GREEN}${BOLD}Options:${NC}"
  echo -e "  -h, --help                 Show this help message"
  echo -e "  -u, --github-user USER     Specify GitHub username (default: from config)"
  echo -e "  -r, --github-repo REPO     Specify GitHub repository (default: from config)"
  echo -e "  -o, --output-file FILE     Specify output file path (default: ~/Documents/JIRA-GitHub-Data.json)"
  echo -e "  -a, --app APP              Specify application to open output file (default: TextEdit)"
  echo -e "  -n, --no-browser           Don't open tickets/PRs in browser"
  echo -e "  -t, --test                 Run tests instead of the main script"
  echo -e "  -c, --configure            Run interactive configuration wizard"
  echo -e "  -s, --summary              Show summary of tickets and PRs without opening browser"
  echo -e "  -m, --menu                 Show interactive menu with common operations"
  echo
  echo -e "${YELLOW}${BOLD}Examples:${NC}"
  echo -e "  $0 --github-user myuser --github-repo myproject"
  echo -e "  $0 --output-file ~/Desktop/tickets.json --app \"Visual Studio Code\""
  echo -e "  $0 --no-browser"
  echo -e "  $0 --test"
  echo -e "  $0 --configure"
  echo -e "  $0 --summary"
  echo -e "  $0 --menu"
  echo
}

# Check if script exists
if [ ! -f "$JXA_SCRIPT" ]; then
  echo -e "${RED}Error: JXA script not found at $JXA_SCRIPT${NC}"
  exit 1
fi

# Display progress spinner
spinner() {
  local pid=$1
  local delay=0.1
  local spinstr='|/-\'
  while ps -p $pid > /dev/null; do
    local temp=${spinstr#?}
    printf " [%c]  " "$spinstr"
    local spinstr=$temp${spinstr%"$temp"}
    sleep $delay
    printf "\b\b\b\b\b\b"
  done
  printf "    \b\b\b\b"
}

# Run the configuration wizard
function run_configuration_wizard {
  echo -e "${BLUE}${BOLD}JIRA and GitHub Integration Configuration Wizard${NC}"
  echo -e "This wizard will help you set up the integration with your JIRA and GitHub accounts."
  echo
  
  # Create config directory if it doesn't exist
  mkdir -p "$CONFIG_DIR"
  
  # JIRA Configuration
  echo -e "${CYAN}${BOLD}JIRA Configuration:${NC}"
  read -p "JIRA Base URL (e.g., https://your-domain.atlassian.net/rest/api/2/): " jira_url
  read -p "JIRA Project Key: " jira_project
  read -p "JIRA Status (default: Open): " jira_status
  jira_status=${jira_status:-Open}
  
  # GitHub Configuration
  echo -e "${CYAN}${BOLD}GitHub Configuration:${NC}"
  read -p "GitHub Username: " github_username
  read -p "GitHub Repository: " github_repo
  
  # Output Configuration
  echo -e "${CYAN}${BOLD}Output Configuration:${NC}"
  read -p "Output File Path (default: ~/Documents/JIRA-GitHub-Data.json): " output_path
  output_path=${output_path:-~/Documents/JIRA-GitHub-Data.json}
  read -p "Application to Open Output (default: TextEdit): " output_app
  output_app=${output_app:-TextEdit}
  
  # API Token Configuration
  echo -e "${CYAN}${BOLD}API Token Configuration:${NC}"
  echo -e "Would you like to store your API tokens in the macOS Keychain?"
  read -p "Enter 'y' for yes, 'n' for no (default: y): " store_tokens
  store_tokens=${store_tokens:-y}
  
  if [[ $store_tokens == 'y' ]]; then
    # JIRA API Token
    echo -e "${YELLOW}Please enter your JIRA API Token:${NC}"
    read -s jira_token
    echo
    
    # Store JIRA token in Keychain
    security add-generic-password -s "JIRA API Token" -a "JIRA API Token" -w "$jira_token" 2>/dev/null
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}JIRA API Token stored in Keychain successfully!${NC}"
    else
      echo -e "${RED}Failed to store JIRA API Token in Keychain. You can add it manually later.${NC}"
    fi
    
    # GitHub API Token
    echo -e "${YELLOW}Please enter your GitHub API Token:${NC}"
    read -s github_token
    echo
    
    # Store GitHub token in Keychain
    security add-generic-password -s "GitHub API Token" -a "GitHub API Token" -w "$github_token" 2>/dev/null
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}GitHub API Token stored in Keychain successfully!${NC}"
    else
      echo -e "${RED}Failed to store GitHub API Token in Keychain. You can add it manually later.${NC}"
    fi
  fi
  
  # Create configuration JSON
  cat > "$CONFIG_FILE" << EOF
{
  "jira": {
    "baseUrl": "$jira_url",
    "project": "$jira_project",
    "status": "$jira_status"
  },
  "github": {
    "username": "$github_username",
    "repo": "$github_repo"
  },
  "output": {
    "filePath": "$output_path",
    "appName": "$output_app"
  }
}
EOF
  
  echo -e "${GREEN}${BOLD}Configuration saved to $CONFIG_FILE${NC}"
  echo -e "You can now run the integration with: $0"
}

# Show summary of tickets and PRs
function show_summary {
  echo -e "${BLUE}${BOLD}Fetching JIRA tickets and GitHub PRs...${NC}"
  
  # Create a temporary file to store the output
  TEMP_OUTPUT_FILE="/tmp/jira-github-summary-$$.json"
  
  # Run the script with summary option
  PARAMS="const options = {}; options.openInBrowser = false; options.outputFilePath = '$TEMP_OUTPUT_FILE'; options.summaryOnly = true; main(options);"
  
  # Execute the script and capture its output
  osascript -l JavaScript -e "$(cat "$JXA_SCRIPT")" -e "$PARAMS" > /dev/null 2>&1 &
  PID=$!
  spinner $PID
  
  wait $PID
  EXIT_CODE=$?
  
  if [ $EXIT_CODE -ne 0 ]; then
    echo -e "${RED}Failed to retrieve data!${NC}"
    exit $EXIT_CODE
  fi
  
  # Display summary from the JSON file
  if [ -f "$TEMP_OUTPUT_FILE" ]; then
    echo -e "\n${CYAN}${BOLD}Summary:${NC}\n"
    
    # Extract and format JIRA tickets
    echo -e "${YELLOW}${BOLD}JIRA Tickets:${NC}"
    tickets=$(cat "$TEMP_OUTPUT_FILE" | grep -o '"jiraTickets":\[.*\],' | sed 's/"jiraTickets":\[\(.*\)\],/\1/')
    if [ -n "$tickets" ] && [ "$tickets" != "[]" ]; then
      echo "$tickets" | grep -o '{[^}]*}' | while read -r ticket; do
        key=$(echo "$ticket" | grep -o '"key":"[^"]*"' | cut -d':' -f2 | tr -d '"')
        summary=$(echo "$ticket" | grep -o '"summary":"[^"]*"' | cut -d':' -f2 | tr -d '"')
        status=$(echo "$ticket" | grep -o '"name":"[^"]*"' | cut -d':' -f2 | tr -d '"')
        echo -e "  - ${BOLD}$key:${NC} $summary (${CYAN}$status${NC})"
      done
    else
      echo -e "  No tickets found."
    fi
    
    # Extract and format GitHub PRs
    echo -e "\n${YELLOW}${BOLD}GitHub Pull Requests:${NC}"
    prs=$(cat "$TEMP_OUTPUT_FILE" | grep -o '"githubPullRequests":\[.*\]}' | sed 's/"githubPullRequests":\[\(.*\)\]}/\1/')
    if [ -n "$prs" ] && [ "$prs" != "[]" ]; then
      echo "$prs" | grep -o '{[^}]*}' | while read -r pr; do
        number=$(echo "$pr" | grep -o '"number":[0-9]*' | cut -d':' -f2)
        title=$(echo "$pr" | grep -o '"title":"[^"]*"' | cut -d':' -f2 | tr -d '"')
        user=$(echo "$pr" | grep -o '"login":"[^"]*"' | cut -d':' -f2 | tr -d '"')
        echo -e "  - ${BOLD}#$number:${NC} $title (${CYAN}$user${NC})"
      done
    else
      echo -e "  No pull requests found."
    fi
    
    echo
    rm -f "$TEMP_OUTPUT_FILE"
  else
    echo -e "${RED}No summary data available!${NC}"
  fi
}

# Interactive menu
function show_interactive_menu {
  clear
  echo -e "${BLUE}${BOLD}JIRA and GitHub Integration Menu${NC}\n"
  
  PS3="Select an option (1-9): "
  options=(
    "Fetch JIRA tickets and GitHub PRs" 
    "Show summary (no browser)" 
    "Run with custom GitHub repository" 
    "Custom output location" 
    "Run configuration wizard" 
    "Run tests" 
    "Check stored API tokens" 
    "Help" 
    "Exit"
  )
  
  select opt in "${options[@]}"; do
    case $REPLY in
      1)
        echo -e "\n${GREEN}Fetching JIRA tickets and GitHub PRs...${NC}"
        osascript -l JavaScript "$JXA_SCRIPT" &
        PID=$!
        spinner $PID
        wait $PID
        if [ $? -eq 0 ]; then
          echo -e "\n${GREEN}Completed successfully!${NC}"
        else
          echo -e "\n${RED}Failed with error!${NC}"
        fi
        ;;
      2)
        show_summary
        ;;
      3)
        read -p "Enter GitHub username: " custom_user
        read -p "Enter GitHub repository: " custom_repo
        echo -e "\n${GREEN}Fetching data for $custom_user/$custom_repo...${NC}"
        PARAMS="const options = {}; options.githubUsername = '$custom_user'; options.githubRepo = '$custom_repo'; main(options);"
        osascript -l JavaScript -e "$(cat "$JXA_SCRIPT")" -e "$PARAMS" &
        PID=$!
        spinner $PID
        wait $PID
        if [ $? -eq 0 ]; then
          echo -e "\n${GREEN}Completed successfully!${NC}"
        else
          echo -e "\n${RED}Failed with error!${NC}"
        fi
        ;;
      4)
        read -p "Enter output file path: " custom_output
        read -p "Enter application to open output: " custom_app
        echo -e "\n${GREEN}Fetching data and saving to $custom_output...${NC}"
        PARAMS="const options = {}; options.outputFilePath = '$custom_output'; options.outputApp = '$custom_app'; main(options);"
        osascript -l JavaScript -e "$(cat "$JXA_SCRIPT")" -e "$PARAMS" &
        PID=$!
        spinner $PID
        wait $PID
        if [ $? -eq 0 ]; then
          echo -e "\n${GREEN}Completed successfully!${NC}"
        else
          echo -e "\n${RED}Failed with error!${NC}"
        fi
        ;;
      5)
        run_configuration_wizard
        ;;
      6)
        echo -e "\n${GREEN}Running tests...${NC}"
        osascript -l JavaScript "$SCRIPT_DIR/tests/test-integration.js"
        ;;
      7)
        echo -e "\n${YELLOW}Checking API tokens in Keychain...${NC}"
        echo -n "JIRA API Token: "
        security find-generic-password -s "JIRA API Token" -w >/dev/null 2>&1
        if [ $? -eq 0 ]; then
          echo -e "${GREEN}Found in Keychain${NC}"
        else
          echo -e "${RED}Not found in Keychain${NC}"
        fi
        echo -n "GitHub API Token: "
        security find-generic-password -s "GitHub API Token" -w >/dev/null 2>&1
        if [ $? -eq 0 ]; then
          echo -e "${GREEN}Found in Keychain${NC}"
        else
          echo -e "${RED}Not found in Keychain${NC}"
        fi
        ;;
      8)
        show_help
        ;;
      9)
        echo -e "\n${GREEN}Exiting...${NC}"
        exit 0
        ;;
      *)
        echo -e "\n${RED}Invalid option. Please try again.${NC}"
        ;;
    esac
    echo
    read -p "Press Enter to continue..."
    show_interactive_menu
  done
}

# Load saved configuration if exists
function load_config {
  if [ -f "$CONFIG_FILE" ]; then
    # Extract values from config file
    SAVED_GITHUB_USER=$(grep -o '"username":"[^"]*"' "$CONFIG_FILE" | cut -d':' -f2 | tr -d '"')
    SAVED_GITHUB_REPO=$(grep -o '"repo":"[^"]*"' "$CONFIG_FILE" | cut -d':' -f2 | tr -d '"')
    SAVED_OUTPUT_FILE=$(grep -o '"filePath":"[^"]*"' "$CONFIG_FILE" | cut -d':' -f2 | tr -d '"')
    SAVED_OUTPUT_APP=$(grep -o '"appName":"[^"]*"' "$CONFIG_FILE" | cut -d':' -f2 | tr -d '"')
    
    # Set default values from config if not provided as arguments
    if [ -z "$GITHUB_USER" ] && [ -n "$SAVED_GITHUB_USER" ]; then
      GITHUB_USER=$SAVED_GITHUB_USER
    fi
    
    if [ -z "$GITHUB_REPO" ] && [ -n "$SAVED_GITHUB_REPO" ]; then
      GITHUB_REPO=$SAVED_GITHUB_REPO
    fi
    
    if [ -z "$OUTPUT_FILE" ] && [ -n "$SAVED_OUTPUT_FILE" ]; then
      OUTPUT_FILE=$SAVED_OUTPUT_FILE
    fi
    
    if [ -z "$OUTPUT_APP" ] && [ -n "$SAVED_OUTPUT_APP" ]; then
      OUTPUT_APP=$SAVED_OUTPUT_APP
    fi
  fi
}

# Parse command line arguments
GITHUB_USER=""
GITHUB_REPO=""
OUTPUT_FILE=""
OUTPUT_APP=""
OPEN_BROWSER=true
RUN_TESTS=false
RUN_CONFIG=false
SHOW_SUMMARY=false
SHOW_MENU=false

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
    -c|--configure)
      RUN_CONFIG=true
      shift
      ;;
    -s|--summary)
      SHOW_SUMMARY=true
      shift
      ;;
    -m|--menu)
      SHOW_MENU=true
      shift
      ;;
    *)
      echo -e "${RED}Unknown option: $key${NC}"
      show_help
      exit 1
      ;;
  esac
done

# Load config
load_config

# Run the appropriate action based on arguments
if [ "$RUN_CONFIG" = true ]; then
  run_configuration_wizard
  exit 0
fi

if [ "$SHOW_MENU" = true ]; then
  show_interactive_menu
  exit 0
fi

if [ "$SHOW_SUMMARY" = true ]; then
  show_summary
  exit 0
fi

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
  osascript -l JavaScript -e "$(cat "$JXA_SCRIPT")" -e "$PARAMS" &
else
  osascript -l JavaScript "$JXA_SCRIPT" &
fi

PID=$!
spinner $PID
wait $PID

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo -e "\n${GREEN}Integration completed successfully!${NC}"
else
  echo -e "\n${RED}Integration failed with exit code $EXIT_CODE${NC}"
fi

exit $EXIT_CODE