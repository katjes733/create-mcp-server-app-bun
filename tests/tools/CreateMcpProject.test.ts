import { describe, it, expect, beforeEach, jest, afterEach } from "bun:test";
import {
  CreateMcpProject,
  DEFAULT_ACTION,
  DEFAULT_PROJECT_PATH,
} from "~/tools/CreateMcpProject";
import dedent from "dedent";

const mockFetch = jest.fn();

function createInstance() {
  const instance = new CreateMcpProject(
    mockFetch as unknown as typeof globalThis.fetch,
  );
  return instance;
}

describe("CreateMcpProject", () => {
  const originalAppName = process.env.APP_NAME;

  const expectedName = "create-mcp-project";
  const expectedDescription = dedent`
      Initialize a new project for creating an MCP server with sample code in the desktop.
      System Prompt:
      - Always ask the user for the 'name' of the project if it is not provided. Avoid inferring or making up a name.
      - If the project already exists, ask the user whether to overwrite it ("replace") or create a new project with a different name.
      - Avoid assuming actions or names. Always explicitly ask the user for missing information.
      Parameters:
      - 'name' (optional): name of the project. If none provided, it will be requested from the user.
      - 'projectPath': path where the project will be created, default is 'Documents/projects'.
      - 'action' (optional): set to "replace" to overwrite an existing project. Otherwise, it defaults to "create".
    `;
  const expectedInputSchema = {
    type: "object",
    properties: {
      name: { type: "string" },
      projectPath: { type: "string", default: DEFAULT_PROJECT_PATH },
      action: {
        type: "string",
        enum: ["create", "replace"],
        default: DEFAULT_ACTION,
      },
    },
    required: [],
  };

  beforeEach(() => {
    process.env.APP_NAME = "sample-mcp-server";
    mockFetch.mockReset();
  });

  afterEach(() => {
    process.env.APP_NAME = originalAppName;
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

  it("validateWithDefaults accepts valid gridPointUrl", () => {
    const tool = createInstance();
    expect(
      tool.validateWithDefaults({
        name: "dummy-mcp-project",
        projectPath: "custom/path",
        action: "replace",
      }),
    ).toEqual({
      name: "dummy-mcp-project",
      projectPath: "/custom/path",
      action: "replace",
    });
    expect(
      tool.validateWithDefaults({
        name: "dummy-mcp-project",
        projectPath: "/custom/path",
      }),
    ).toEqual({
      name: "dummy-mcp-project",
      projectPath: "/custom/path",
      action: DEFAULT_ACTION,
    });
    expect(
      tool.validateWithDefaults({
        name: "dummy-mcp-project",
      }),
    ).toEqual({
      name: "dummy-mcp-project",
      projectPath: `/${DEFAULT_PROJECT_PATH}`,
      action: DEFAULT_ACTION,
    });
  });
});
