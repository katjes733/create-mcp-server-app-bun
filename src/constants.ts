export const PROJECT_NAME = "sample-app";

export const INDEX_TEXT = `
import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"

// Create server instance
const server = new Server({
  name: "sample-app", 
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
})

const TOOL_NAME = "sum-calculator"

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [{
      name: TOOL_NAME,
      description: "Add two numbers.",
      inputSchema: {
        type: "object",
        properties: {
          a: { type: "number" },
          b: { type: "number" }
        },
        required: ["a", "b"],
      }
    }]
  }
})

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === TOOL_NAME && request.params.arguments !== undefined) {

    const {a, b} = request.params.arguments
    if (typeof(a) !== "number" || typeof(b) !== "number") {
      throw new Error("Bad parameter.")
    }
    return {
      content: [ {
        type: "text",
        text: String(a + b)
      }]
    }
  }

  throw new Error("Tool not found")
})

// Start the server
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error("MCP Server running on stdio.")
}

main().catch((error) => {
  console.error("Fatal error while running server:", error)
  process.exit(1)
})
`;

export const PACKAGE_JSON = `
{
  "name": "${PROJECT_NAME}",
  "version": "1.0.0",
  "description": "",
  "main": "main.js",
  "type": "module",
  "bin": {
    "${PROJECT_NAME}": "build/main.js"
  },
  "scripts": {
    "build": "bun build src/main.ts --outdir build --target bun",
    "eslint": "bun x eslint src/*",
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
  "license": "MIT License",
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
      "~/*": ["*"],
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
    "forceConsistentCasingInFileNames": true,
  },
}
`;
