
# JIRA and GitHub Integration Script

This script allows you to retrieve JIRA tickets and GitHub pull requests using API tokens stored in the macOS Keychain. It provides various features to enhance the user experience and integrate with the macOS ecosystem.

## Features

- Retrieves JIRA tickets and GitHub pull requests using API tokens securely stored in the Keychain.
- Opens JIRA tickets and GitHub pull requests in the default web browser for quick access.
- Saves the retrieved data as a formatted JSON file and opens it in TextEdit for further analysis.
- Displays notifications using the Notification Center for successful data retrieval or errors.
- Indexes the output file with Spotlight for easy searching and accessibility.
- Provides functions to manage API tokens in the Keychain securely.
- Includes error handling and logging for Keychain-related operations.

## Prerequisites

Before running the script, ensure that you have the following:

- macOS operating system.
- JIRA and GitHub API tokens saved in the macOS Keychain with the appropriate service names.
- Required permissions to access the Keychain and perform system-level operations.

## Getting Started

1. Clone or download the script file to your local machine.

2. Open the script file in a text editor and customize the following constants according to your setup:
   - `JIRA_BASE_URL`: The base URL of your JIRA instance.
   - `GITHUB_BASE_URL`: The base URL of the GitHub API.
   - `JIRA_TOKEN_KEYCHAIN_ITEM`: The service name under which your JIRA API token is stored in the Keychain.
   - `GITHUB_TOKEN_KEYCHAIN_ITEM`: The service name under which your GitHub API token is stored in the Keychain.
   - `OUTPUT_FILE_PATH`: The desired file path where the retrieved data will be saved.

3. Replace `"myusername"` and `"myrepo"` in the `getGithubPullRequests` function with your actual GitHub username and repository name.

4. Save the script file with a `.js` extension, for example, `JIRAGitHubIntegration.js`.

## Usage

To run the script, open the Terminal and navigate to the directory where the script file is located. Then, execute the following command:

## osascript -l JavaScript JIRAGitHubIntegration.js


The script will retrieve the JIRA tickets and GitHub pull requests, open them in the default web browser, save the data to a file, display notifications, and index the file with Spotlight.

## Customization

Feel free to customize and enhance the script based on your specific requirements. You can modify the JIRA query, add additional features, or integrate with other macOS APIs to extend the functionality.

## Troubleshooting

- If you encounter any issues related to Keychain access or permissions, ensure that you have the necessary permissions and that the API tokens are stored correctly in the Keychain.
- If the script fails to retrieve data from JIRA or GitHub, double-check your API tokens and the respective base URLs.

## License

This script is licensed under the [MIT License](LICENSE). Feel free to modify and distribute it according to the terms of the license.

## Acknowledgements

This script was developed using JavaScript for Automation (JXA) and utilizes various macOS APIs and system commands. Special thanks to the developers and contributors of the JXA community for their valuable resources and examples.

## Author

Thomas Vincent

For any questions or suggestions, please feel free to reach out to me.
