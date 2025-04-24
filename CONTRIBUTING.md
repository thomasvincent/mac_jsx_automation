# Contributing to JIRA and GitHub Integration Script

Thank you for considering contributing to this project! Here are some guidelines to help you get started.

## Code of Conduct

By participating in this project, you are expected to uphold our [Code of Conduct](CODE_OF_CONDUCT.md).

## How Can I Contribute?

### Reporting Bugs

- Before submitting a bug report, please check the existing issues to see if someone has already reported the problem.
- When you are creating a bug report, please include as many details as possible:
  - A clear and descriptive title
  - Steps to reproduce the issue
  - Expected behavior
  - Actual behavior
  - Screenshots if applicable
  - Your environment (macOS version, etc.)

### Suggesting Enhancements

- Before submitting an enhancement suggestion, please check the existing issues to see if someone has already suggested it.
- When you are creating an enhancement suggestion, please include:
  - A clear and descriptive title
  - A detailed description of the proposed enhancement
  - Any potential implementation details
  - Why this enhancement would be useful

### Pull Requests

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature-name`)
3. Make your changes
4. Run tests to ensure they pass
5. Commit your changes using a descriptive commit message following the [Conventional Commits](https://www.conventionalcommits.org/) format
6. Push to your branch (`git push origin feature/your-feature-name`)
7. Open a Pull Request

## Development Setup

1. Clone the repository
2. Make sure you have the necessary permissions to access the macOS Keychain
3. Set up your JIRA and GitHub API tokens in the Keychain

## Coding Guidelines

- Follow the existing code style
- Write clear, descriptive commit messages following the Conventional Commits format
- Add comments for complex code sections
- Update documentation when necessary

## Testing

- Run the test script (`./test_jiragithub.jxa`) to ensure your changes don't break existing functionality
- Add new tests for new features

## License

By contributing to this project, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
