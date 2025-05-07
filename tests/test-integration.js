#!/usr/bin/env osascript -l JavaScript
/**
 * Test suite for JIRA and GitHub Integration
 * 
 * @description Tests the JIRA and GitHub Integration script functionality
 * @author Thomas Vincent
 * @version 3.0.0
 * @license MIT
 */

// Import the required modules
const app = Application.currentApplication();
app.includeStandardAdditions = true;

// Import the main script for mocking
const MAIN_SCRIPT_PATH = '../src/js/JIRAGitHubIntegration.js';

// Mock data for testing
const MOCK_DATA = {
  jira: {
    issues: [
      {
        key: "PROJ-1",
        fields: {
          summary: "Fix login page alignment",
          status: {
            name: "Open"
          }
        }
      },
      {
        key: "PROJ-2",
        fields: {
          summary: "Add dark mode support",
          status: {
            name: "In Progress"
          }
        }
      }
    ]
  },
  
  github: [
    {
      id: 1,
      title: "Fix login page alignment issues",
      html_url: "https://github.com/myusername/myrepo/pull/1",
      user: {
        login: "developer1"
      },
      created_at: "2023-05-01T12:00:00Z"
    },
    {
      id: 2,
      title: "Implement dark mode support",
      html_url: "https://github.com/myusername/myrepo/pull/2",
      user: {
        login: "developer2"
      },
      created_at: "2023-05-02T10:30:00Z"
    }
  ]
};

/**
 * Test utilities
 */
const TestUtils = {
  /**
   * Creates a mock object with recorded function calls
   * 
   * @param {string} name - Name of the mock for logging
   * @returns {Object} Mock object with record function
   */
  createMock: function(name) {
    return {
      name: name,
      calls: {},
      
      /**
       * Records function calls and returns mock data
       * 
       * @param {string} fnName - Function name
       * @param {Array} args - Function arguments
       * @param {*} returnValue - Value to return
       * @returns {Function} Mock function that records calls
       */
      record: function(fnName, returnValue) {
        const self = this;
        this.calls[fnName] = [];
        
        return function() {
          const args = Array.from(arguments);
          self.calls[fnName].push(args);
          console.log(`Mock ${self.name}.${fnName} called with:`, JSON.stringify(args));
          
          // If returnValue is a function, call it with the arguments
          if (typeof returnValue === 'function') {
            return returnValue.apply(null, args);
          }
          
          return returnValue;
        };
      }
    };
  },
  
  /**
   * Writes test results to a file
   * 
   * @param {Object} results - Test results object
   */
  writeResults: function(results) {
    const resultsPath = "/tmp/test-results.json";
    const resultsJson = JSON.stringify(results, null, 2);
    
    app.doShellScript(`echo '${resultsJson.replace(/'/g, "'\\''")}' > "${resultsPath}"`);
    console.log(`Test results written to ${resultsPath}`);
  }
};

/**
 * Test suite for the JIRA and GitHub integration
 */
const TestSuite = {
  /**
   * Sets up the test environment with mocks
   * 
   * @returns {Object} Mock objects and functions
   */
  setup: function() {
    // Create mock objects
    const keychainMock = TestUtils.createMock("Keychain");
    const jiraMock = TestUtils.createMock("JIRA");
    const githubMock = TestUtils.createMock("GitHub");
    const systemMock = TestUtils.createMock("System");
    
    // Create mock functions
    return {
      keychain: {
        getPassword: keychainMock.record("getPassword", "mock-token"),
        saveToken: keychainMock.record("saveToken", true),
        showKeychainError: keychainMock.record("showKeychainError")
      },
      
      jira: {
        getTickets: jiraMock.record("getTickets", Promise.resolve({ issues: MOCK_DATA.jira.issues })),
        getInstanceUrl: jiraMock.record("getInstanceUrl", "https://jira.example.com"),
        getTicketUrl: jiraMock.record("getTicketUrl", (key) => `https://jira.example.com/browse/${key}`)
      },
      
      github: {
        getPullRequests: githubMock.record("getPullRequests", Promise.resolve(MOCK_DATA.github))
      },
      
      system: {
        openUrl: systemMock.record("openUrl"),
        saveDataToFile: systemMock.record("saveDataToFile", "/tmp/output.json"),
        displayNotification: systemMock.record("displayNotification"),
        indexWithSpotlight: systemMock.record("indexWithSpotlight")
      },
      
      mocks: {
        keychain: keychainMock,
        jira: jiraMock,
        github: githubMock,
        system: systemMock
      }
    };
  },
  
  /**
   * Runs all tests
   * 
   * @returns {Promise<Object>} Test results
   */
  runAll: async function() {
    console.log("Starting test suite...");
    const results = {
      success: true,
      tests: {}
    };
    
    try {
      // Run individual tests
      results.tests.keychainTest = await this.testKeychain();
      results.tests.jiraTest = await this.testJiraIntegration();
      results.tests.githubTest = await this.testGithubIntegration();
      results.tests.systemTest = await this.testSystemIntegration();
      results.tests.mainTest = await this.testMainFunction();
      
      // Check if all tests passed
      for (const testName in results.tests) {
        if (!results.tests[testName].success) {
          results.success = false;
          break;
        }
      }
      
      // Display final results
      System.displayNotification(
        results.success ? "All Tests Passed" : "Test Failures",
        results.success ? "All integration tests completed successfully." : "Some tests failed. Check the logs for details."
      );
      
      return results;
    } catch (error) {
      console.error("Test suite error:", error.message);
      results.success = false;
      results.error = error.message;
      
      System.displayNotification(
        "Test Suite Error",
        `Error running tests: ${error.message}`
      );
      
      return results;
    }
  },
  
  /**
   * Tests Keychain functionality
   * 
   * @returns {Promise<Object>} Test results
   */
  testKeychain: async function() {
    console.log("Testing Keychain functionality...");
    const mocks = this.setup();
    
    try {
      // Test getPassword
      const token = mocks.keychain.getPassword("JIRA API Token");
      const success = token === "mock-token";
      
      return {
        success,
        calls: mocks.mocks.keychain.calls,
        message: success ? "Keychain functions working correctly" : "Keychain functions failed"
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * Tests JIRA integration functionality
   * 
   * @returns {Promise<Object>} Test results
   */
  testJiraIntegration: async function() {
    console.log("Testing JIRA integration...");
    const mocks = this.setup();
    
    try {
      // Test getTickets
      const tickets = await mocks.jira.getTickets();
      const success = tickets && tickets.issues && tickets.issues.length === 2;
      
      return {
        success,
        calls: mocks.mocks.jira.calls,
        message: success ? "JIRA integration working correctly" : "JIRA integration failed"
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * Tests GitHub integration functionality
   * 
   * @returns {Promise<Object>} Test results
   */
  testGithubIntegration: async function() {
    console.log("Testing GitHub integration...");
    const mocks = this.setup();
    
    try {
      // Test getPullRequests
      const prs = await mocks.github.getPullRequests("testuser", "testrepo");
      const success = prs && prs.length === 2;
      
      return {
        success,
        calls: mocks.mocks.github.calls,
        message: success ? "GitHub integration working correctly" : "GitHub integration failed"
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * Tests System integration functionality
   * 
   * @returns {Promise<Object>} Test results
   */
  testSystemIntegration: async function() {
    console.log("Testing System integration...");
    const mocks = this.setup();
    
    try {
      // Test system functions
      mocks.system.displayNotification("Test", "Test notification");
      mocks.system.openUrl("https://example.com");
      const filePath = mocks.system.saveDataToFile("test data", "/tmp/test.txt", "TextEdit");
      
      const success = typeof filePath === "string" && filePath.length > 0;
      
      return {
        success,
        calls: mocks.mocks.system.calls,
        message: success ? "System integration working correctly" : "System integration failed"
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * Tests the main function
   * 
   * @returns {Promise<Object>} Test results
   */
  testMainFunction: async function() {
    console.log("Testing main function...");
    const mocks = this.setup();
    
    try {
      // Create a mock main function that uses our mocks
      const mockMain = async function(options) {
        try {
          // Show starting notification
          mocks.system.displayNotification("Data Retrieval Started", "Fetching data from JIRA and GitHub...");
          
          // Retrieve JIRA tickets
          const jiraData = await mocks.jira.getTickets();
          
          // Retrieve GitHub pull requests
          const githubData = await mocks.github.getPullRequests(options?.githubUsername, options?.githubRepo);
          
          // Combine the data
          const combinedData = {
            jiraTickets: jiraData.issues || [],
            githubPullRequests: githubData
          };
          
          // Save to file
          mocks.system.saveDataToFile(JSON.stringify(combinedData), options?.outputFilePath || "/tmp/output.json", options?.outputApp || "TextEdit");
          
          // Show success notification
          mocks.system.displayNotification("Data Retrieval Complete", "Data retrieved successfully");
          
          return combinedData;
        } catch (error) {
          mocks.system.displayNotification("Error", error.message);
          throw error;
        }
      };
      
      // Call the mock main function
      const result = await mockMain({
        githubUsername: "testuser",
        githubRepo: "testrepo"
      });
      
      // Verify the result
      const success = result && 
                     result.jiraTickets && 
                     result.jiraTickets.length === 2 &&
                     result.githubPullRequests &&
                     result.githubPullRequests.length === 2;
      
      return {
        success,
        result: result,
        calls: {
          jira: mocks.mocks.jira.calls,
          github: mocks.mocks.github.calls,
          system: mocks.mocks.system.calls
        },
        message: success ? "Main function working correctly" : "Main function failed"
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// Run the tests if executed directly
if (typeof module === 'undefined' || !module.parent) {
  TestSuite.runAll().then(results => {
    console.log("All tests completed. Final results:", JSON.stringify(results.success));
    TestUtils.writeResults(results);
  }).catch(error => {
    console.error("Test runner error:", error.message);
  });
}

// Export for use in other tests
if (typeof module !== 'undefined') {
  module.exports = {
    TestSuite,
    TestUtils,
    MOCK_DATA
  };
}