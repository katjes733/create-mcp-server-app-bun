export const PROJECT_NAME = "${PROJECT_NAME}";

export const MAIN_TEXT = `
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Create server instance
const server = new Server(
  {
    name: "${PROJECT_NAME}",
    version: "1.0.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  },
);

const TOOL_NAME = "sum-calculator";
const TOOL_DESCRIPTION = \`
Add two numbers.
System Prompt:
- Always ask the user for the 'a' and 'b' parameters if they are not provided. Avoid inferring or making up values.
- If the parameters are not numbers, ask the user to provide valid numbers.
Parameters:
- 'a': first number to add. If not provided, it will be requested from the user.
- 'b': second number to add. If not provided, it will be requested from the user.
\`;

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: TOOL_NAME,
        description: TOOL_DESCRIPTION,
        inputSchema: {
          type: "object",
          properties: {
            a: { type: "number" },
            b: { type: "number" },
          },
          required: ["a", "b"],
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (
    request.params.name === TOOL_NAME &&
    request.params.arguments !== undefined
  ) {
    const { a, b } = request.params.arguments;
    if (typeof a !== "number" || typeof b !== "number") {
      throw new Error("Bad parameter.");
    }
    return {
      content: [
        {
          type: "text",
          text: String(a + b),
        },
      ],
    };
  }

  throw new Error("Tool not found");
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server running on stdio.");
}

main().catch((error) => {
  console.error("Fatal error while running server:", error);
  process.exit(1);
});
`;

export const PACKAGE_JSON = `
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
    "eslint": "bun x eslint src",
    "eslint:fix": "bun eslint -- --quiet --fix",
    "prettier": "bun x prettier --check src/*",
    "prettier:fix": "bun x prettier --write src/*",
    "start": "bun run src/main.ts",
    "stylelint": "stylelint 'src/**/*.tsx' --aei",
    "stylelint:fix": "stylelint 'src/**/*.tsx' --aei --fix",
    "test": "bun test",
    "test:coverage": "bun test --coverage",
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
    "@typescript-eslint/eslint-plugin": "^8.33.0",
    "@typescript-eslint/parser": "^8.33.0",
    "bun-types": "^1.2.14",
    "eslint": "^9.27.0",
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
    "pino": "^9.7.0",
    "pino-pretty": "^13.0.0"
  }
}
`;

export const TSCONFIG = `
{
  "compilerOptions": {
    "outDir": "./build/",
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "ESNext",
    "moduleDetection": "force",
    "jsx": "react-jsx",
    "allowJs": true,
    "types": ["bun-types"],
    "baseUrl": "./src",
    "paths": {
      "~/*": ["*"]
    },

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,

    /* Linting */
    "skipLibCheck": true,
    "strict": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  },
}
`;

export const ESLINT_CONFIG = `
import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import ts from "@typescript-eslint/eslint-plugin";
import parser from "@typescript-eslint/parser";
import globals from "globals";

export default defineConfig([
  js.configs.recommended,
  {
    name: "node-bun-config",
    files: ["src/**/*.ts", "src/**/*.tsx"],
    languageOptions: {
      parser,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        console: true,
        process: true,
        module: true,
        require: true,
        Bun: true,
      },
    },
    plugins: {
      "@typescript-eslint": ts,
    },
    rules: {},
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    settings: {
      "import/resolver": {
        node: true,
      },
    },
    ignores: ["**/__tests__/**", "**/*.test.ts"],
  },
]);
`;

export const GIT_IGNORE = `
logs
_.log
coverage
*.lcov
node_modules/
.env
.DS_Store
build/
`;

export const PRETTIER_IGNORE = `
dist
build
coverage
`;

export const STYLELINT_CONFIG = `
extends:
  - stylelint-config-recommended
  - stylelint-config-prettier
`;

export const README = `
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
`;

export const GITHUB_WORKFLOWS_VERIFY = `
name: verify

on:
  push:
    branches-ignore:
      - main
      - master
  pull_request:
    branches:
      - main

  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install Dependencies
        run: bun install

      - name: Run Prettier
        id: prettier-run
        run: bun prettier

      - name: Run Eslint
        id: eslint-run
        run: bun eslint

      - name: Run Stylelint
        id: stylelint-run
        run: bun stylelint

      - name: Run Tsc
        id: tsc-run
        run: bun tsc

      - name: Run Test Coverage
        id: test-coverage-run
        run: bun test:coverage
`;

export const VSCODE_EXTENSIONS = `
{
  "recommendations": [
    "davidanson.vscode-markdownlint",
    "yzhang.markdown-all-in-one",
    "dbaeumer.vscode-eslint",
    "stylelint.vscode-stylelint",
    "esbenp.prettier-vscode",
    "orta.vscode-jest",
    "timonwong.shellcheck"
  ]
}
`;

export const VSCODE_SETTINGS = `
{
  "typescript.tsdk": "./node_modules/typescript/lib",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.fixAll.stylelint": "explicit"
  },
  "files.insertFinalNewline": true,
  "[markdown]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.validate": ["typescript", "typescriptreact"],
  "prettier.trailingComma": "all",
  "prettier.useEditorConfig": false
}
`;
