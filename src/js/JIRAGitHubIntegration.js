#!/usr/bin/env osascript -l JavaScript
/**
 * JIRA and GitHub Integration for macOS
 * 
 * @description Retrieves JIRA tickets and GitHub pull requests using API tokens stored in the Keychain.
 * @author Thomas Vincent
 * @version 3.0.0
 * @copyright Copyright (c) 2023-2025 Thomas Vincent
 * @license MIT
 */

// Import the required modules for macOS integration
const app = Application.currentApplication();
app.includeStandardAdditions = true;

// Configuration - Edit these values to match your environment
const CONFIG = {
  // JIRA Configuration
  jira: {
    baseUrl: "https://jira.example.com/rest/api/2/",
    keychainItem: "JIRA API Token",
    project: "MyProject",
    status: "Open",
    fields: "summary,status"
  },
  
  // GitHub Configuration
  github: {
    baseUrl: "https://api.github.com/",
    keychainItem: "GitHub API Token",
    defaultUsername: "myusername",
    defaultRepo: "myrepo"
  },
  
  // Output Configuration
  output: {
    filePath: "~/Documents/JIRA-GitHub-Data.json",
    appName: "TextEdit",
    openInBrowser: true,
    enableSpotlightIndexing: true
  }
};

/**
 * Keychain utilities for secure credential management
 */
const Keychain = {
  /**
   * Retrieves a password from the macOS Keychain
   * 
   * @param {string} serviceName - The name of the Keychain item
   * @returns {string} The retrieved password or empty string if not found
   */
  getPassword: function(serviceName) {
    try {
      const password = app.doShellScript(`security find-generic-password -s "${serviceName}" -w`);
      return password.trim();
    } catch (error) {
      console.log(`Error retrieving password from Keychain: ${error.message}`);
      this.showKeychainError(serviceName, "retrieve");
      return "";
    }
  },
  
  /**
   * Saves an API token to the macOS Keychain
   * 
   * @param {string} serviceName - The name of the Keychain item
   * @param {string} token - The API token to save
   * @returns {boolean} True if successful, false otherwise
   */
  saveToken: function(serviceName, token) {
    try {
      app.doShellScript(`security add-generic-password -s "${serviceName}" -a "${serviceName}" -w "${token}"`);
      console.log(`Token saved to Keychain: ${serviceName}`);
      return true;
    } catch (error) {
      console.log(`Error saving token to Keychain: ${error.message}`);
      this.showKeychainError(serviceName, "save");
      return false;
    }
  },
  
  /**
   * Shows a dialog for Keychain errors with options to fix
   * 
   * @param {string} serviceName - The Keychain item name
   * @param {string} operation - The operation that failed (retrieve|save)
   */
  showKeychainError: function(serviceName, operation) {
    const action = operation === "retrieve" ? "retrieve from" : "save to";
    const message = `Unable to ${action} Keychain for "${serviceName}". Would you like to enter the token manually?`;
    
    const response = app.displayDialog(message, {
      buttons: ["Cancel", "Enter Token"],
      defaultButton: "Enter Token",
      withIcon: "caution"
    });
    
    if (response.buttonReturned === "Enter Token") {
      const tokenResponse = app.displayDialog(`Enter your ${serviceName}:`, {
        defaultAnswer: "",
        buttons: ["Cancel", "Save"],
        defaultButton: "Save",
        withIcon: "note",
        hiddenAnswer: true
      });
      
      if (tokenResponse.buttonReturned === "Save") {
        this.saveToken(serviceName, tokenResponse.textReturned);
      }
    }
  }
};

/**
 * JIRA integration utilities
 */
const JIRA = {
  /**
   * Retrieves a list of JIRA tickets using the API token from the Keychain
   * 
   * @returns {Promise<Object>} A promise that resolves to an object containing JIRA tickets
   */
  getTickets: function() {
    const url = CONFIG.jira.baseUrl + "search";
    const jql = encodeURIComponent(`project = ${CONFIG.jira.project} AND status = ${CONFIG.jira.status}`);
    const fields = encodeURIComponent(CONFIG.jira.fields);
    const token = Keychain.getPassword(CONFIG.jira.keychainItem);
    
    if (!token) {
      return Promise.reject(new Error("No JIRA API token found in Keychain"));
    }
    
    const curlCommand = `curl -s -X GET "${url}?jql=${jql}&fields=${fields}" -H "Authorization: Bearer ${token}" -H "Content-Type: application/json"`;
    
    return new Promise((resolve, reject) => {
      try {
        const response = app.doShellScript(curlCommand);
        const jsonResponse = JSON.parse(response);
        resolve(jsonResponse);
      } catch (error) {
        reject(new Error(`Error fetching JIRA tickets: ${error.message}`));
      }
    });
  },
  
  /**
   * Extracts the JIRA instance URL from the API base URL
   * 
   * @returns {string} The JIRA instance URL
   */
  getInstanceUrl: function() {
    const match = CONFIG.jira.baseUrl.match(/^(https?:\/\/[^\/]+)/);
    return match ? match[1] : CONFIG.jira.baseUrl;
  },
  
  /**
   * Creates a URL for a specific JIRA ticket
   * 
   * @param {string} ticketKey - The JIRA ticket key
   * @returns {string} The URL to view the ticket
   */
  getTicketUrl: function(ticketKey) {
    return `${this.getInstanceUrl()}/browse/${ticketKey}`;
  }
};

/**
 * GitHub integration utilities
 */
const GitHub = {
  /**
   * Retrieves a list of GitHub pull requests using the API token from the Keychain
   * 
   * @param {string} username - The GitHub username
   * @param {string} repo - The GitHub repository name
   * @returns {Promise<Array>} A promise that resolves to an array of GitHub pull requests
   */
  getPullRequests: function(username, repo) {
    username = username || CONFIG.github.defaultUsername;
    repo = repo || CONFIG.github.defaultRepo;
    
    console.log(`Fetching GitHub pull requests for: ${username}/${repo}`);
    
    const url = `${CONFIG.github.baseUrl}repos/${username}/${repo}/pulls?state=open`;
    const token = Keychain.getPassword(CONFIG.github.keychainItem);
    
    if (!token) {
      return Promise.reject(new Error("No GitHub API token found in Keychain"));
    }
    
    const curlCommand = `curl -s -X GET "${url}" -H "Authorization: Bearer ${token}" -H "Accept: application/vnd.github.v3+json" -H "X-GitHub-Api-Version: 2022-11-28"`;
    
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
};

/**
 * macOS system integration utilities
 */
const System = {
  /**
   * Opens the specified URL in the default web browser
   * 
   * @param {string} url - The URL to open
   */
  openUrl: function(url) {
    app.openLocation(url);
  },
  
  /**
   * Saves data to a file and opens it in the specified application
   * 
   * @param {string} data - The data to save
   * @param {string} filePath - The file path to save the data
   * @param {string} appName - The name of the application to open the file with
   * @returns {string} The expanded file path
   */
  saveDataToFile: function(data, filePath, appName) {
    // Expand the tilde in the file path if it exists
    const expandedPath = filePath.replace(/^~/, app.pathTo("home folder"));
    
    try {
      // Ensure the directory exists
      const dirPath = expandedPath.substring(0, expandedPath.lastIndexOf("/"));
      app.doShellScript(`mkdir -p "${dirPath}"`);
      
      // Write the data to the file
      app.doShellScript(`echo '${data.replace(/'/g, "'\\''")}' > "${expandedPath}"`);
      
      // Open the file with the specified application
      if (appName) {
        app.doShellScript(`open -a "${appName}" "${expandedPath}"`);
      }
      
      return expandedPath;
    } catch (error) {
      console.error(`Error saving data to file: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Displays a notification using the macOS Notification Center
   * 
   * @param {string} title - The title of the notification
   * @param {string} message - The message of the notification
   * @param {string} [sound] - Optional sound name to play
   */
  displayNotification: function(title, message, sound) {
    const options = { 
      withTitle: title 
    };
    
    if (sound) {
      options.soundName = sound;
    }
    
    app.displayNotification(message, options);
  },
  
  /**
   * Performs Spotlight indexing on the specified file path
   * 
   * @param {string} filePath - The file path to index
   */
  indexWithSpotlight: function(filePath) {
    app.doShellScript(`mdimport "${filePath}"`);
  }
};

/**
 * Main function to retrieve JIRA tickets and GitHub pull requests
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.githubUsername - GitHub username
 * @param {string} options.githubRepo - GitHub repository name
 * @param {boolean} options.openInBrowser - Whether to open items in browser
 * @param {string} options.outputFilePath - Output file path
 * @param {string} options.outputApp - App to open the output file
 * @param {boolean} options.summaryOnly - Only generate summary, don't open files
 * @param {boolean} options.richNotifications - Use rich notifications with clickable buttons
 * @returns {Promise<Object>} The combined data
 */
async function main(options = {}) {
  // Merge options with defaults from CONFIG
  const config = {
    githubUsername: options.githubUsername || CONFIG.github.defaultUsername,
    githubRepo: options.githubRepo || CONFIG.github.defaultRepo,
    openInBrowser: options.openInBrowser !== undefined ? options.openInBrowser : CONFIG.output.openInBrowser,
    outputFilePath: options.outputFilePath || CONFIG.output.filePath,
    outputApp: options.outputApp || CONFIG.output.appName,
    summaryOnly: options.summaryOnly || false,
    richNotifications: options.richNotifications !== undefined ? options.richNotifications : true
  };
  
  try {
    // Show starting notification
    System.displayNotification(
      "Data Retrieval Started", 
      "Fetching data from JIRA and GitHub..."
    );
    
    // Retrieve JIRA tickets
    const jiraData = await JIRA.getTickets();
    const ticketCount = jiraData.issues ? jiraData.issues.length : 0;
    console.log(`JIRA tickets retrieved: ${ticketCount}`);
    
    // Open JIRA tickets in the browser if configured
    if (config.openInBrowser && jiraData.issues && jiraData.issues.length > 0) {
      jiraData.issues.forEach(ticket => {
        const ticketUrl = JIRA.getTicketUrl(ticket.key);
        System.openUrl(ticketUrl);
      });
    }
    
    // Retrieve GitHub pull requests
    const githubData = await GitHub.getPullRequests(config.githubUsername, config.githubRepo);
    console.log(`GitHub pull requests retrieved: ${githubData.length}`);
    
    // Open GitHub pull requests in the browser if configured
    if (config.openInBrowser && githubData.length > 0) {
      githubData.forEach(pr => {
        if (pr.html_url) {
          System.openUrl(pr.html_url);
        }
      });
    }
    
    // Combine and format the data
    const combinedData = {
      metadata: {
        generated: new Date().toISOString(),
        jiraProject: CONFIG.jira.project,
        githubRepo: `${config.githubUsername}/${config.githubRepo}`
      },
      jiraTickets: jiraData.issues || [],
      githubPullRequests: githubData
    };
    
    // Convert to formatted JSON string
    const dataString = JSON.stringify(combinedData, null, 2);
    
    // Create rich notification with summary if enabled
    if (config.richNotifications && !config.summaryOnly) {
      showRichSummaryNotification(combinedData);
    }
    
    // If we're only generating summary, just save the data and return
    if (config.summaryOnly) {
      if (config.outputFilePath) {
        System.saveDataToFile(dataString, config.outputFilePath);
      }
      return combinedData;
    }
    
    // Save data to a file and open it
    const savedFilePath = System.saveDataToFile(dataString, config.outputFilePath, config.outputApp);
    
    // Index the output file with Spotlight if enabled
    if (CONFIG.output.enableSpotlightIndexing) {
      System.indexWithSpotlight(savedFilePath);
    }
    
    // Display a success notification
    System.displayNotification(
      "Data Retrieval Complete", 
      `Retrieved ${ticketCount} JIRA tickets and ${githubData.length} GitHub pull requests.`,
      "Glass"
    );
    
    return combinedData;
  } catch (error) {
    console.error("Error:", error.message);
    
    // Display an error notification
    System.displayNotification(
      "Error", 
      `Failed to retrieve data: ${error.message}`,
      "Basso"
    );
    
    throw error;
  }
}

/**
 * Shows a rich notification with summary data and interactive buttons
 * 
 * @param {Object} data - The combined data from JIRA and GitHub
 */
function showRichSummaryNotification(data) {
  const jiraCount = data.jiraTickets.length;
  const prCount = data.githubPullRequests.length;
  
  let summaryText = "";
  
  // Add JIRA ticket summary
  if (jiraCount > 0) {
    summaryText += `JIRA Tickets (${jiraCount}):\n`;
    data.jiraTickets.slice(0, 3).forEach(ticket => {
      summaryText += `• ${ticket.key}: ${ticket.fields.summary}\n`;
    });
    if (jiraCount > 3) {
      summaryText += `• ...and ${jiraCount - 3} more\n`;
    }
  } else {
    summaryText += "No JIRA tickets found.\n";
  }
  
  // Add GitHub PR summary
  if (prCount > 0) {
    summaryText += `\nGitHub PRs (${prCount}):\n`;
    data.githubPullRequests.slice(0, 3).forEach(pr => {
      summaryText += `• #${pr.number}: ${pr.title}\n`;
    });
    if (prCount > 3) {
      summaryText += `• ...and ${prCount - 3} more\n`;
    }
  } else {
    summaryText += "\nNo GitHub pull requests found.";
  }
  
  // Show the summary notification
  System.displayNotification(
    "Summary", 
    summaryText,
    "Glass"
  );
  
  // Note: macOS doesn't support buttons in notifications via JXA,
  // but if we could, we would add buttons to open all tickets/PRs or view the detailed JSON
}

// Run the main function when executed directly
if (typeof module === 'undefined' || !module.parent) {
  main();
}

// Export the functions for testing and reuse
if (typeof module !== 'undefined') {
  module.exports = {
    Keychain,
    JIRA,
    GitHub,
    System,
    main,
    CONFIG
  };
}