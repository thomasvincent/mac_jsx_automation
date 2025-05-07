# JIRA and GitHub Integration for macOS

This project provides an integration between JIRA and GitHub for macOS, allowing you to retrieve JIRA tickets and GitHub pull requests using API tokens stored securely in the macOS Keychain.

## Features

- **Secure Authentication**: Uses macOS Keychain for secure storage of API tokens
- **JIRA Integration**: Retrieves and displays JIRA tickets with customizable JQL queries
- **GitHub Integration**: Fetches pull requests from specified repositories
- **macOS Integration**:
  - Native notifications via Notification Center
  - Opens items in default web browser
  - Spotlight indexing for search integration
  - Automator workflow for easy access
  - Command-line interface via bash wrapper
- **Data Export**: Saves retrieved data as formatted JSON for further processing
- **Error Handling**: Comprehensive error handling with user-friendly notifications
- **Testing**: Includes test suite with mocking capabilities

## Directory Structure

```
.
├── dist/                     # Distribution files
│   └── JIRAGitHubIntegration.workflow  # Automator workflow
├── src/                      # Source code
│   └── js/                   # JavaScript source files
│       └── JIRAGitHubIntegration.js  # Main integration script
├── tests/                    # Test files
│   └── test-integration.js   # Test suite for integration
├── .github/                  # GitHub specific files
│   └── workflows/            # GitHub Actions workflows
│       └── ci.yml            # Continuous integration workflow
├── jira-github-integration.sh # Bash wrapper script
├── JIRAGitHubIntegrationShortcut.js  # Legacy script (for backward compatibility)
├── LICENSE                   # License file
└── README.md                 # This file
```

## Prerequisites

- macOS operating system
- JIRA and GitHub API tokens
- Required permissions to access the Keychain

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/macos-jira-github-integration-shortcut.git
   cd macos-jira-github-integration-shortcut
   ```

2. Make the scripts executable:
   ```bash
   chmod +x src/js/JIRAGitHubIntegration.js
   chmod +x jira-github-integration.sh
   ```

3. Configure the script by editing the CONFIG object in `src/js/JIRAGitHubIntegration.js`:
   ```javascript
   const CONFIG = {
     jira: {
       baseUrl: "https://your-jira-instance.atlassian.net/rest/api/2/",
       keychainItem: "JIRA API Token",
       // other JIRA settings...
     },
     github: {
       baseUrl: "https://api.github.com/",
       keychainItem: "GitHub API Token",
       defaultUsername: "yourusername",
       defaultRepo: "yourrepo",
     },
     // output settings...
   };
   ```

4. Install the Automator workflow (optional):
   - Double-click the `dist/JIRAGitHubIntegration.workflow` file
   - Click "Install" when prompted to install the workflow
   - The workflow will be available in the macOS Services menu

## Usage

### Command Line Interface

Use the bash wrapper script with various options:

```bash
./jira-github-integration.sh
```

Available options:
- `-h, --help`: Show help message
- `-u, --github-user USER`: Specify GitHub username
- `-r, --github-repo REPO`: Specify GitHub repository
- `-o, --output-file FILE`: Specify output file path
- `-a, --app APP`: Specify application to open output file
- `-n, --no-browser`: Don't open tickets/PRs in browser
- `-t, --test`: Run tests instead of the main script

Examples:
```bash
./jira-github-integration.sh --github-user myuser --github-repo myproject
./jira-github-integration.sh --output-file ~/Desktop/tickets.json --app "Visual Studio Code"
./jira-github-integration.sh --no-browser
./jira-github-integration.sh --test
```

### Direct Execution

You can also run the script directly:

```bash
osascript -l JavaScript src/js/JIRAGitHubIntegration.js
```

### Automator Workflow

After installing the workflow, you can access it from:
- The Services menu in any application
- The Quick Actions menu in Finder
- Keyboard shortcuts (if configured in System Preferences)

## Storing API Tokens in Keychain

To store your API tokens in the macOS Keychain:

1. Open Keychain Access (Applications > Utilities > Keychain Access)
2. Click "+" to add a new password item
3. Set "Keychain Item Name" to match the `keychainItem` values in the CONFIG object
4. Paste your API token in the "Password" field
5. Click "Add" to save the item

Alternatively, you can use the terminal:

```bash
security add-generic-password -s "JIRA API Token" -a "JIRA API Token" -w "your-token-here"
security add-generic-password -s "GitHub API Token" -a "GitHub API Token" -w "your-token-here"
```

## Running Tests

To run the test suite:

```bash
./jira-github-integration.sh --test
```

Or directly:

```bash
osascript -l JavaScript tests/test-integration.js
```

## Versioning and Releases

This project follows semantic versioning (SemVer) guidelines:

- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality additions
- **PATCH** version for backwards-compatible bug fixes

### Creating a New Release

For maintainers, to create a new release:

1. Update code and commit changes
2. Run one of the versioning commands:
   ```bash
   # For a patch release (bug fixes)
   npm run version:patch
   
   # For a minor release (new features)
   npm run version:minor
   
   # For a major release (breaking changes)
   npm run version:major
   ```
3. Push changes and tags to trigger the release workflow:
   ```bash
   npm run release
   ```

This will:
- Update version numbers across all files
- Create a Git tag
- Push changes to GitHub
- Trigger the release workflow to:
  - Create a GitHub Release with release notes
  - Publish to GitHub Packages
  - Generate a distributable ZIP file

### Installing from GitHub Packages

To install the package from GitHub Packages:

```bash
# Configure npm to use GitHub Packages
echo "@thomasvincent:registry=https://npm.pkg.github.com" >> .npmrc

# Install the package
npm install @thomasvincent/macos-jira-github-integration
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

Thomas Vincent

For any questions or suggestions, please feel free to reach out to me.