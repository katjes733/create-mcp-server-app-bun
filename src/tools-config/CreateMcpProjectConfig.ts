import dedent from "dedent";

export const PROJECT_NAME: string = "${PROJECT_NAME}";

export const FILES: {
  filename: string;
  relativePath?: string;
  content?: string;
}[] = [
  {
    filename: "log.ts",
    relativePath: "src",
  },
  {
    filename: "helper.ts",
    relativePath: "src",
  },
  {
    filename: "main.ts",
    relativePath: "src",
  },
  {
    filename: "ToolValidationError.ts",
    relativePath: "src/errors",
  },
  {
    filename: "AbstractTool.ts",
    relativePath: "src/types",
  },
  {
    filename: "ITool.ts",
    relativePath: "src/types",
  },
  {
    filename: "SumCalculator.ts",
    relativePath: "src/tools",
    content: dedent`
      // This tool calculates the sum of two numbers.
    `,
  },
  {
    filename: "all.test.ts",
    relativePath: "tests",
  },
  {
    filename: "helper.test.ts",
    relativePath: "tests",
  },
  {
    filename: "log.test.ts",
    relativePath: "tests",
  },
  {
    filename: "main.test.ts",
    relativePath: "tests",
  },
  {
    filename: "ToolValidationError.test.ts",
    relativePath: "tests/errors",
  },
  {
    filename: "SumCalculator.test.ts",
    relativePath: "tests/tools",
    content: dedent`
      // This tests the sum calculator tool.
    `,
  },
  {
    filename: "AbstractTool.test.ts",
    relativePath: "tests/types",
  },
  {
    filename: ".env",
    content: dedent`
      # The name of the application
      APP_NAME=${PROJECT_NAME}
    `,
  },
  {
    filename: "package.json",
    content: dedent`
      {
        "name": "${PROJECT_NAME}",
        "version": "1.0.0",
        "description": "",
        "main": "main.ts",
        "type": "module",
        "bin": {
          "${PROJECT_NAME}": "build/main.js"
        },
        "scripts": {
          "build": "bun build src/main.ts --outdir build --target bun --minify",
          "eslint": "bun x eslint src tests",
          "eslint:fix": "bun eslint -- --quiet --fix",
          "prettier": "bun x prettier --check src/* tests/*",
          "prettier:fix": "bun x prettier --write src/* tests/*",
          "start": "bun run src/main.ts",
          "stylelint": "stylelint 'src/**/*.tsx' --aei",
          "stylelint:fix": "stylelint 'src/**/*.tsx' --aei --fix",
          "test": "bun test",
          "test:coverage": "bun test --coverage",
          "test:coverage:lcov": "bun test --coverage --coverage-reporter=text --coverage-reporter=lcov",
          "tsc": "tsc --noEmit",
          "verify": "bun prettier && bun eslint && bun stylelint && bun tsc && bun test:coverage"
        },
        "files": [
          "build"
        ],
        "keywords": [
          "typescript",
          "bun",
          "mcp"
        ],
        "author": "",
        "license": "",
        "devDependencies": {
          "@types/bun": "^1.2.14",
          "@typescript-eslint/eslint-plugin": "^8.33.1",
          "@typescript-eslint/parser": "^8.33.1",
          "bun-types": "^1.2.14",
          "eslint": "^9.28.0",
          "prettier": "^3.5.3",
          "stylelint": "^16.19.1",
          "stylelint-config-prettier": "^9.0.5",
          "stylelint-config-recommended": "^16.0.0"
        },
        "peerDependencies": {
          "typescript": "^5.8.3"
        },
        "dependencies": {
          "@modelcontextprotocol/sdk": "^1.12.0",
          "dedent": "^1.6.0",
          "pino": "^9.7.0",
          "pino-pretty": "^13.0.0"
        }
      }
    `,
  },
  {
    filename: "tsconfig.json",
  },
  {
    filename: "eslint.config.mjs",
  },
  {
    filename: ".gitignore",
  },
  {
    filename: ".prettierignore",
  },
  {
    filename: ".stylelintrc.yml",
  },
  {
    filename: "README.md",
    content: dedent`
      # MCP Server Sample Project

      This is a sample project for the Model Context Protocol (MCP) server using Bun.

      - [MCP Server Sample Project](#mcp-server-sample-project)
        - [Background](#background)
        - [Prerequisites](#prerequisites)
        - [Setup Project](#setup-project)
        - [Build](#build)
        - [Setup Claude Desktop](#setup-claude-desktop)
        - [Usage](#usage)

      ## Background

      It demonstrates how to set up a basic server that can handle tool requests and execute them. It supports adding two numbers and includes a system prompt guiding the LLM to handles the request appropriately.

      ## Prerequisites

      1. [Bun](https://bun.sh/docs/installation#installing) must be installed.
      2. [Claude Desktop](https://claude.ai/download) should be installed.

      ## Setup Project

      1. Run:

        \`\`\`sh
        bun install
        \`\`\`

      2. _(Optional)_ Run the following to verify integrity of the project:

        \`\`\`sh
        bun run verify
        \`\`\`

      ## Build

      1. Run:

        \`\`\`sh
        bun run build
        \`\`\`

      This will bundle all code into a single \`build/main.js\` that can be consumed.

      ## Setup Claude Desktop

      This section is influenced by this general [guide](https://modelcontextprotocol.io/quickstart/user) with specifics for this use case.

      1. Start Claude Desktop and open Settings (**not** Account setting).
      2. Click on \`Developer\` in the left-hand bar of the Settings pane, and then click on \`Edit Config\`.
      3. Edit the file \`claude_desktop_config.json\` and add the following:

        \`\`\`json
        {
          "mcpServers": {
            "<sample-mcp-app>": {
              "command": "bun",
              "args": ["run", "<path_to_project>/build/main.js"]
            }
          }
        }
        \`\`\`

        - Replace <sample-mcp-app> with the name of your MCP Server: e.g. \`my-mcp-server\`
        - Replace <path_to_project> with the path to your project; e.g.: \`/Users/username/Documents/projects/create-mcp-server-app-bun\`

      4. Restart Claude Desktop; this is important as Claude Desktop will otherwise not apply changes to \`claude_desktop_config.json\`.
      5. On the main screen, click the \`Search and Tools\` button and then on your MCP server name. Ensure that it is enabled.

      ## Usage

      1. You can start by simply asking Claude to add two numbers: \`add 2 and 3\`, which outputs the corresponding result.
      2. You can also ask Claude to add two numbers: \`add numbers\`. This will trigger a follow-up request to provide the two numbers. Once provided, the response will contain the corresponding result.
    `,
  },
  {
    filename: "verify.yml",
    relativePath: ".github/workflows",
  },
  {
    filename: "PULL_REQUEST_TEMPLATE.md",
    relativePath: ".github",
  },
  {
    filename: "extensions.json",
    relativePath: ".vscode",
  },
  {
    filename: "settings.json",
    relativePath: ".vscode",
  },
];

export const SCRIPTS: {
  name?: string;
  command: string;
  workingDirectory?: string;
}[] = [
  {
    name: "install",
    command: "bun install",
  },
  {
    name: "verify",
    command: "bun run verify",
  },
  {
    name: "build",
    command: "bun run build",
  },
];
