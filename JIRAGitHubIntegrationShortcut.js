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
 * @returns {Promise<Object>} A promise that resolves to an object containing JIRA tickets.
 */
function getJiraTickets() {
    const url = JIRA_BASE_URL + "search";
    const jql = encodeURIComponent("project = MyProject AND status = Open");
    const fields = encodeURIComponent("summary,status");
    
    const curlCommand = `curl -s -X GET "${url}?jql=${jql}&fields=${fields}" -H "Authorization: Bearer ${getPasswordFromKeychain(JIRA_TOKEN_KEYCHAIN_ITEM)}" -H "Content-Type: application/json"`;
    
    return new Promise((resolve, reject) => {
        try {
            const response = app.doShellScript(curlCommand);
            const jsonResponse = JSON.parse(response);
            resolve(jsonResponse);
        } catch (error) {
            reject(new Error(`Error fetching JIRA tickets: ${error.message}`));
        }
    });
}

/**
 * Retrieves a list of GitHub pull requests using the API token from the Keychain.
 * @param {string} username - The GitHub username.
 * @param {string} repo - The GitHub repository name.
 * @returns {Promise<Array>} A promise that resolves to an array of GitHub pull requests.
 */
function getGithubPullRequests(username, repo) {
    if (!username || !repo) {
        username = "myusername"; // Default username
        repo = "myrepo"; // Default repository
        console.log(`Using default GitHub repository: ${username}/${repo}`);
    }
    
    const url = `${GITHUB_BASE_URL}repos/${username}/${repo}/pulls?state=open`;
    
    const curlCommand = `curl -s -X GET "${url}" -H "Authorization: Bearer ${getPasswordFromKeychain(GITHUB_TOKEN_KEYCHAIN_ITEM)}" -H "Accept: application/vnd.github.v3+json"`;
    
    return new Promise((resolve, reject) => {
        try {
            const response = app.doShellScript(curlCommand);
            const jsonResponse = JSON.parse(response);
            resolve(jsonResponse);
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
    // Expand the tilde in the file path if it exists
    const expandedPath = filePath.replace(/^~/, app.pathTo("home folder"));
    
    // Write the data to the file
    app.doShellScript(`echo '${data.replace(/'/g, "'\\''")}' > "${expandedPath}"`);
    
    // Open the file with the specified application
    app.doShellScript(`open -a "${appName}" "${expandedPath}"`);
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
 * Extracts the JIRA instance URL from the API base URL.
 * @returns {string} The JIRA instance URL.
 */
function getJiraInstanceUrl() {
    // Extract the base URL without the API path
    const match = JIRA_BASE_URL.match(/^(https?:\/\/[^\/]+)/);
    return match ? match[1] : JIRA_BASE_URL;
}

/**
 * Main function to retrieve JIRA tickets and GitHub pull requests.
 * @param {string} githubUsername - Optional GitHub username.
 * @param {string} githubRepo - Optional GitHub repository name.
 */
async function main(githubUsername, githubRepo) {
    try {
        // Retrieve JIRA tickets
        const jiraData = await getJiraTickets();
        console.log("JIRA tickets retrieved:", jiraData.issues ? jiraData.issues.length : 0);

        // Get the JIRA instance URL for browsing tickets
        const jiraInstanceUrl = getJiraInstanceUrl();

        // Open JIRA tickets in the browser
        if (jiraData.issues && jiraData.issues.length > 0) {
            jiraData.issues.forEach(ticket => {
                const ticketUrl = `${jiraInstanceUrl}/browse/${ticket.key}`;
                openUrlInBrowser(ticketUrl);
            });
        }

        // Retrieve GitHub pull requests
        const githubData = await getGithubPullRequests(githubUsername, githubRepo);
        console.log("GitHub pull requests retrieved:", githubData.length);

        // Open GitHub pull requests in the browser
        if (githubData.length > 0) {
            githubData.forEach(pr => {
                if (pr.html_url) {
                    openUrlInBrowser(pr.html_url);
                }
            });
        }

        // Save data to a file and open it in TextEdit
        const combinedData = {
            jiraTickets: jiraData.issues || [],
            githubPullRequests: githubData
        };
        const dataString = JSON.stringify(combinedData, null, 2);
        saveDataToFile(dataString, OUTPUT_FILE_PATH, "TextEdit");

        // Display a notification for successful data retrieval
        displayNotification("Data Retrieval", "JIRA tickets and GitHub pull requests retrieved successfully.");

        // Index the output file with Spotlight
        indexFileWithSpotlight(OUTPUT_FILE_PATH);

        return combinedData;
    } catch (error) {
        console.error("Error:", error.message);
        displayNotification("Error", error.message);
        throw error;
    }
}

// Run the main function
main();
