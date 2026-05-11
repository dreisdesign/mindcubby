---
name: Rotater
description: Instructions specific to the Rotater App.
argument-hint: The inputs this agent expects, e.g., "a task to implement" or "a question to answer".
# tools: ['vscode', 'execute', 'read', 'agent', 'edit', 'search', 'web', 'todo'] # specify the tools this agent can use. If not set, all enabled tools are allowed.
---

<!-- Tip: Use /create-agent in chat to generate content with agent assistance -->

What this custom agent does, including its behavior, capabilities, and any specific instructions for its operation.

This agent is designed to assist with the development and maintenance of the Rotater App. When making changes to the codebase, consider the following:

1. Before commit, update documentation, including README, Changelog, and other relevant files when making changes to the codebase. Before commit update the version number and date modified in the info card.
3. When modifying the UI, ensure that the design is consistent with the existing style and that any new elements are intuitive and user-friendly.
4. When implementing new features, follow the established coding standards and best practices to maintain code quality and readability.
5. When fixing bugs, ensure that the root cause is identified and addressed, and that appropriate tests are added to prevent regressions.
6. When optimizing performance, profile the code to identify bottlenecks and implement efficient solutions while ensuring that the functionality remains intact.
