#!/usr/bin/env osascript -l JavaScript

/**
 * @description Retrieves JIRA tickets and GitHub pull requests using API tokens stored in the Keychain.
 * @author Thomas Vincent
 * @version 2.0
 */

// Import the required modules
const app = Application.currentApplication();
app.includeStandardAdditions = true;

// Set the base URLs for the JIRA and GitHub APIs
const JIRA_BASE_URL = "https://jira.example.com/rest/api/2/";
const GITHUB_BASE_URL = "https://api.github.com/";

// Set the Keychain item names for storing the API tokens
const JIRA_TOKEN_KEYCHAIN_ITEM = "JIRA API Token";
const GITHUB_TOKEN_KEYCHAIN_ITEM = "GitHub API Token";

// Set the default output file path
const OUTPUT_FILE_PATH = "~/Documents/JIRA-GitHub-Data.txt";

/**
 * Retrieves a password from the macOS Keychain.
 * @param {string} serviceName - The name of the Keychain item.
 * @returns {string} The retrieved password.
 */
function getPasswordFromKeychain(serviceName) {
    try {
        const password = app.doShellScript(`security find-generic-password -s "${serviceName}" -w`);
        return password.trim();
    } catch (error) {
        console.log(`Error retrieving password from Keychain: ${error.message}`);
        return "";
    }
}

/**
 * Saves the API token to the macOS Keychain.
 * @param {string} serviceName - The name of the Keychain item.
 * @param {string} token - The API token to save.
 */
function saveTokenToKeychain(serviceName, token) {
    try {
        app.doShellScript(`security add-generic-password -s "${serviceName}" -a "${serviceName}" -w "${token}"`);
        console.log(`Token saved to Keychain: ${serviceName}`);
    } catch (error) {
        console.log(`Error saving token to Keychain: ${error.message}`);
    }
}

/**
 * Retrieves a list of JIRA tickets using the API token from the Keychain.
 * @returns {Promise<Array>} A promise that resolves to an array of JIRA tickets.
 */
function getJiraTickets() {
    const url = JIRA_BASE_URL + "search";
    const parameters = {
        jql: "project = MyProject AND status = Open",
        fields: "summary, status"
    };
    const headers = {
        Authorization: `Bearer ${getPasswordFromKeychain(JIRA_TOKEN_KEYCHAIN_ITEM)}`
    };

    return new Promise((resolve, reject) => {
        try {
            const response = app.doJSONRequest(url, {
                httpMethod: "GET",
                queryParameters: parameters,
                httpHeaders: headers
            });
            resolve(response);
        } catch (error) {
            reject(new Error(`Error fetching JIRA tickets: ${error.message}`));
        }
    });
}

/**
 * Retrieves a list of GitHub pull requests using the API token from the Keychain.
 * @returns {Promise<Array>} A promise that resolves to an array of GitHub pull requests.
 */
function getGithubPullRequests() {
    const url = GITHUB_BASE_URL + "repos/myusername/myrepo/pulls";
    const parameters = {
        state: "open"
    };
    const headers = {
        Authorization: `Bearer ${getPasswordFromKeychain(GITHUB_TOKEN_KEYCHAIN_ITEM)}`
    };

    return new Promise((resolve, reject) => {
        try {
            const response = app.doJSONRequest(url, {
                httpMethod: "GET",
                queryParameters: parameters,
                httpHeaders: headers
            });
            resolve(response);
        } catch (error) {
            reject(new Error(`Error fetching GitHub pull requests: ${error.message}`));
        }
    });
}

/**
 * Opens the specified URL in the default web browser.
 * @param {string} url - The URL to open.
 */
function openUrlInBrowser(url) {
    app.openLocation(url);
}

/**
 * Saves the data to a file and opens it in the specified application.
 * @param {string} data - The data to save.
 * @param {string} filePath - The file path to save the data.
 * @param {string} appName - The name of the application to open the file with.
 */
function saveDataToFile(data, filePath, appName) {
    const file = Path(filePath);
    file.writeText(data);
    app.doShellScript(`open -a "${appName}" "${filePath}"`);
}

/**
 * Displays a notification using the Notification Center.
 * @param {string} title - The title of the notification.
 * @param {string} message - The message of the notification.
 */
function displayNotification(title, message) {
    app.displayNotification(message, { withTitle: title });
}

/**
 * Performs Spotlight indexing on the specified file path.
 * @param {string} filePath - The file path to index.
 */
function indexFileWithSpotlight(filePath) {
    app.doShellScript(`mdimport "${filePath}"`);
}

/**
 * Main function to retrieve JIRA tickets and GitHub pull requests.
 */
async function main() {
    try {
        // Retrieve JIRA tickets
        const jiraData = await getJiraTickets();
        console.log("JIRA tickets:", jiraData);

        // Open JIRA tickets in the browser
        jiraData.forEach(ticket => {
            const ticketUrl = `${JIRA_BASE_URL}browse/${ticket.key}`;
            openUrlInBrowser(ticketUrl);
        });

        // Retrieve GitHub pull requests
        const githubData = await getGithubPullRequests();
        console.log("GitHub pull requests:", githubData);

        // Open GitHub pull requests in the browser
        githubData.forEach(pr => {
            const prUrl = pr.html_url;
            openUrlInBrowser(prUrl);
        });

        // Save data to a file and open it in TextEdit
        const combinedData = {
            jiraTickets: jiraData,
            githubPullRequests: githubData
        };
        const dataString = JSON.stringify(combinedData, null, 2);
        saveDataToFile(dataString, OUTPUT_FILE_PATH, "TextEdit");

        // Display a notification for successful data retrieval
        displayNotification("Data Retrieval", "JIRA tickets and GitHub pull requests retrieved successfully.");

        // Index the output file with Spotlight
        indexFileWithSpotlight(OUTPUT_FILE_PATH);

        // Process and use the retrieved data
        // ...

    } catch (error) {
        console.error("Error:", error.message);
        displayNotification("Error", error.message);
    }
}

// Run the main function
main();
