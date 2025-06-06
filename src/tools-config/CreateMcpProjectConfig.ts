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
      import dedent from "dedent";
      import { AbstractTool } from "~/types/AbstractTool";
      import type { ITool } from "~/types/ITool";

      export class SumCalculator extends AbstractTool implements ITool {
        // Explicit constructor definition to ensure test coverage in Bun tracks constructor.
        constructor(fetch: typeof globalThis.fetch = globalThis.fetch) {
          super(fetch);
        }

        getName() {
          return "sum-calculator";
        }

        getDescription() {
          return dedent\`
            Add two numbers.
            System Prompt:
            - Always ask the user for the 'a' and 'b' parameters if they are not provided. Avoid inferring or making up values.
            - If the parameters are not numbers, ask the user to provide valid numbers.
            Parameters:
            - 'a': first number to add. If not provided, it will be requested from the user.
            - 'b': second number to add. If not provided, it will be requested from the user.
          \`;
        }

        getInputSchema(): {
          type: string;
          properties: Record<string, any>;
          required: string[];
        } {
          return {
            type: "object",
            properties: {
              a: { type: "number" },
              b: { type: "number" },
            },
            required: ["a", "b"],
          };
        }

        validateWithDefaults(params: Record<string, any>): Record<string, any> {
          const { a, b } = params;

          if (typeof a !== "number" || typeof b !== "number") {
            throw new Error("Bad parameter.");
          }

          return { a, b };
        }

        async processToolWorkflow(
          params: Record<string, any>,
        ): Promise<{ content: { type: string; text: string }[] }> {
          const { a, b } = params;

          return this.calculateSum(a, b).then((sum) => ({
            content: [
              {
                type: "text",
                text: String(sum),
              },
            ],
          }));
        }

        private async calculateSum(a: number, b: number): Promise<number> {
          return a + b;
        }
      }
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
      import {
        describe,
        it,
        expect,
        beforeEach,
        jest,
        afterEach,
        spyOn,
      } from "bun:test";
      import { SumCalculator } from "~/tools/SumCalculator";
      import dedent from "dedent";

      const mockFetch = jest.fn();

      function createInstance() {
        const instance = new SumCalculator(
          mockFetch as unknown as typeof globalThis.fetch,
        );
        return instance;
      }

      describe("GridPointUrl", () => {
        const originalAppName = process.env.APP_NAME;
        const originalAppEmail = process.env.APP_EMAIL;

        const expectedName = "sum-calculator";
        const expectedDescription = dedent\`
          Add two numbers.
          System Prompt:
          - Always ask the user for the 'a' and 'b' parameters if they are not provided. Avoid inferring or making up values.
          - If the parameters are not numbers, ask the user to provide valid numbers.
          Parameters:
          - 'a': first number to add. If not provided, it will be requested from the user.
          - 'b': second number to add. If not provided, it will be requested from the user.
        \`;
        const expectedInputSchema = {
          type: "object",
          properties: {
            a: { type: "number" },
            b: { type: "number" },
          },
          required: ["a", "b"],
        };

        beforeEach(() => {
          process.env.APP_NAME = "weather-mcp-server";
          process.env.APP_EMAIL = "some.email@net.com";
          mockFetch.mockReset();
        });

        afterEach(() => {
          process.env.APP_NAME = originalAppName;
          process.env.APP_EMAIL = originalAppEmail;
        });

        it("getName returns correct name", () => {
          const tool = createInstance();
          expect(tool.getName()).toBe(expectedName);
        });

        it("getDescription returns a string", () => {
          const tool = createInstance();
          expect(typeof tool.getDescription()).toBe("string");
          expect(tool.getDescription()).toBe(expectedDescription);
        });

        it("getInputSchema returns correct schema", () => {
          const tool = createInstance();
          const schema = tool.getInputSchema();
          expect(schema).toEqual(expectedInputSchema);
        });

        it("validateWithDefaults accepts valid numbers", () => {
          const tool = createInstance();
          expect(tool.validateWithDefaults({ a: -10.5, b: 123.56 })).toEqual({
            a: -10.5,
            b: 123.56,
          });
          expect(tool.validateWithDefaults({ a: 90, b: -180 })).toEqual({
            a: 90,
            b: -180,
          });
        });

        it("validateWithDefaults throws on invalid coordinates", () => {
          const tool = createInstance();
          expect(() => tool.validateWithDefaults({ a: "20", b: 180 })).toThrow(
            "Bad parameter.",
          );
          expect(() => tool.validateWithDefaults({ a: 180, b: "" })).toThrow(
            "Bad parameter.",
          );
        });

        it("processToolWorkflow returns correct content for valid coordinates", async () => {
          const tool = createInstance();
          const calculateSumSpy = spyOn(tool as any, "calculateSum");
          calculateSumSpy.mockResolvedValue(-45.67);
          const result = await tool.processToolWorkflow({
            a: 78,
            b: 99,
          });
          expect(result).toEqual({
            content: [
              {
                type: "text",
                text: "-45.67",
              },
            ],
          });
        });

        it("calculateSum calculates the expected sum", async () => {
          const tool = createInstance();
          const result = await tool["calculateSum"](-78.23, 99.59);
          expect(result).toBe(21.36);
        });
      });
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
    filename: "bunfig.toml",
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
        - [Development](#development)
          - [New Tools](#new-tools)
          - [Test Coverage](#test-coverage)
            - [Prerequisites (Development)](#prerequisites-development)
            - [Running Test Coverage](#running-test-coverage)

      ## Background

      It demonstrates how to set up a basic server that can handle tool requests and execute them. It supports adding two numbers and includes a system prompt guiding the LLM to handles the request appropriately.
      The project also contains all relevant tooling and linting to get started immediately.

      To implement your own custom tool(s), follow the instructions in section [New Tools](#new-tools).

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

      This will bundle the entry \`build/main.js\`, which can then be consumed.

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

      ## Development

      ### New Tools

      New tools may be added by ensuring each new tool module in \`./src/tools\` extends \`AbstractTool\` and implements \`ITool\` and provides an explicit constructor (for test coverage):

      \`\`\`typescript
      ...
      export class NewTool extends AbstractTool implements ITool {
        // Explicit constructor definition to ensure test coverage in Bun tracks constructor.
        constructor(fetch: typeof globalThis.fetch = globalThis.fetch) {
          super(fetch);
        }
      ...
      \`\`\`

      Additionally, the following methods must be implemented (see their corresponding \`JSDoc\` for details.):

      - \`getName\`
      - \`getDescription\`
      - \`getInputSchema\`
      - \`validateWithDefaults\`
      - \`processToolWorkflow\`

      Use existing tool(s) as guide for the implementation and don't forget to implement a corresponding test.

      There is no further configuration required to register any additional tool; they are automatically included upon restart of the MCP server.

      ### Test Coverage

      It may be useful to analyze test coverage gaps using \`lcov\` reports, to gain better visibility into covered lines and functions.

      **NOTES:**

      - Constructors for classes should be defined in the respective class, as Bun only tracks a classes functions (including constructors). This is problematic when you inherit from an abstract class with its own constructor, which in turn is not tracked. Thus, simply define the Abstract constructor in the class and call \`super\`.
      - Having some imports (e.g. \`import dedent from "dedent";\`) at the top of a module may cause Bun to not correctly track that line as covered. Simply move it behind other imports, and it will correctly track.

      #### Prerequisites (Development)

      1. Install \`lcov\`:

        \`\`\`sh
        brew install lcov
        \`\`\`

      2. Install VSCode extension \`ryanluker.vscode-coverage-gutters\` (already defined in [settings.json](./.vscode/settings.json)).

      #### Running Test Coverage

      1. For most cases, it will suffice to run:

        \`\`\`sh
        bun run test:coverage
        \`\`\`

        **NOTE:** If the coverage is less than 100, but no \`Uncovered Line #s\` are reported, you may need to investigate further by following the next steps and revisiting the [Notes](#test-coverage) above.

      2. For advanced cases, run:

        \`\`\`sh
        bun run test:coverage:lcov
        \`\`\`

        It produces the \`lcov\` [coverage report](./coverage/lcov.info) that is used by VSCode extension \`ryanluker.vscode-coverage-gutters\` to visualize covered lines in the editor.

      3. If you prefer to have an HTML report, run in your terminal:

        \`\`\`sh
        genhtml --function-coverage --branch-coverage --output-directory coverage-report coverage/lcov.info
        \`\`\`

        It produces an HTML [coverage report](./coverage-report/index.html) that you can inspect in your preferred browser.
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
