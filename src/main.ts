import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { ProjectHelper } from "./helper.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import logger from "./log.js";

export const TOOL_NAME = "create-mcp-server-app";
export const TOOL_DESCRIPTION = `
Initialize a new project for creating an MCP server with sample code in the desktop.
System Prompt:
- Always ask the user for the 'name' of the project if it is not provided. Avoid inferring or making up a name.
- If the project already exists, ask the user whether to overwrite it ("replace") or create a new project with a different name.
- Avoid assuming actions or names. Always explicitly ask the user for missing information.
Parameters:
- 'name' (optional): name of the project. If none provided, it will be requested from the user.
- 'path': path where the project will be created, default is 'Documents/projects'.
- 'action' (optional): set to "replace" to overwrite an existing project. Otherwise, it defaults to "create".
`;
export const DEFAULT_PROJECT_PATH = "Documents/projects";
export const DEFAULT_ACTION = "create";

const projectHelper = new ProjectHelper();

export const server = new Server(
  {
    name: "create-mcp-app",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

export const listToolsHandler = async () => {
  return {
    tools: [
      {
        name: TOOL_NAME,
        description: TOOL_DESCRIPTION,
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            path: { type: "string", default: DEFAULT_PROJECT_PATH },
            action: {
              type: "string",
              enum: ["create", "replace"],
              default: DEFAULT_ACTION,
            },
          },
          required: [],
        },
      },
    ],
  };
};

server.setRequestHandler(ListToolsRequestSchema, listToolsHandler);

export const callToolHandler = async (request: {
  params: {
    name: string;
    arguments?: {
      name?: string;
      path?: string;
      action?: "create" | "replace" | string;
    };
  };
}) => {
  if (
    request.params.name === TOOL_NAME &&
    request.params.arguments !== undefined
  ) {
    const {
      name,
      path,
      action: actionValue,
    } = request.params.arguments as {
      name?: string;
      path?: string;
      action?: "create" | "replace" | string;
    };

    if (!name || name.trim() === "") {
      return {
        content: [
          {
            type: "text",
            text: "The 'name' parameter is required, but was not provided. Ask the user for the name of the project explicitly.",
          },
        ],
      };
    }

    const projectPath = path || DEFAULT_PROJECT_PATH;
    const action = actionValue || DEFAULT_ACTION;

    const exists = await projectHelper.projectExists(name, projectPath);
    if (exists && action === "create") {
      return {
        content: [
          {
            type: "text",
            text:
              `Project "${name}" already exists at ${projectPath}. ` +
              `Always ask to what action the user wants to do next: replace/overwrite existing or create project with different name.` +
              `Please resubmit with "action": "replace" to overwrite, or have user provide a new project name.`,
          },
        ],
      };
    }

    try {
      let text: string;
      if (action === "replace") {
        await projectHelper.removeProject(name, projectPath);
        text = `Replaced starter project: ${name} for creating an MCP server is created in ~/${projectPath}.`;
      } else if (action === "create") {
        text = `New starter project: ${name} for creating an MCP server is created in ~/${projectPath}.`;
      } else {
        return {
          content: [
            {
              type: "text",
              text: `Invalid action "${action}". Use "create" or "replace".`,
            },
          ],
        };
      }
      await projectHelper.initProject(name, projectPath);
      return {
        content: [
          {
            type: "text",
            text,
          },
        ],
      };
    } catch (err) {
      let errorMessage = "Error occurred while creating the project.";
      if (err instanceof Error) {
        errorMessage += " " + err.message;
      }
      return {
        content: [
          {
            type: "text",
            text: errorMessage,
          },
        ],
      };
    }
  }

  throw new Error("Tool not found");
};

server.setRequestHandler(CallToolRequestSchema, callToolHandler);

export async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("Create-MCP-Project Server running on stdio.");
}

export async function runServer() {
  try {
    await main();
  } catch (error) {
    logger.error("Fatal error while running server:", error);
    process.exit(1);
  }
}

export function startServer(isMain = import.meta.main) {
  if (isMain) {
    runServer();
  }
}

startServer();
