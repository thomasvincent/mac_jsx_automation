# Jira and GitHub Integration Tool using JavaScript for Automation (JXA) on Mac OS X

This script uses JavaScript for Automation (JXA) to retrieve information from Jira and GitHub APIs and display the results in a format suitable for integration into a larger project or dashboard. The script can be run on Mac OS X using the osascript command.

## Prerequisites

- A Mac running OS X
- An active Jira account and API access
- An active GitHub account and API access
- Basic knowledge of JavaScript

## Installation

1. Clone or download this repository to your local machine.
2. Install the required dependencies using `npm install`.

## Usage

1. Open `test_jiragithub.jxa` in a code editor of your choice.
2. Replace the `jira_base_url` and `github_base_url` variables with the base URLs for your Jira and GitHub accounts, respectively.
3. Replace the `jql` and `state` parameters with the desired search parameters for Jira and GitHub, respectively.
4. Save the changes to `test_jiragithub.jxa`.
5. Open Terminal on your Mac and navigate to the directory where you saved the repository.
6. Run the script using the following command: `osascript test_jiragithub.jxa`
7. The script will retrieve information from the Jira and GitHub APIs and display the results in the Terminal.

## GitHub Action

You can also test the script using a GitHub action. The `test.yml` file in this repository can be used to run the script on a Mac OS X machine using GitHub Actions.

To use the action, follow these steps:

1. Fork this repository to your own GitHub account.
2. Edit `test_jiragithub.jxa` as described in the Usage section.
3. Push your changes to the main branch of your forked repository.
4. Navigate to the Actions tab in your forked repository.
5. Select "Test JXA script" from the list of available workflows.
6. Click the "Run workflow" button to run the workflow.
7. The script will run on a Mac OS X machine and the results will be displayed in the action logs.

MAC OS X JXA Automations
