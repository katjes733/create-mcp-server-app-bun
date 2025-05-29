import {
  describe,
  it,
  expect,
  afterEach,
  beforeEach,
  jest,
  mock,
  spyOn,
} from "bun:test";
import {
  listToolsHandler,
  callToolHandler,
  main,
  TOOL_NAME,
  DEFAULT_PROJECT_PATH,
  DEFAULT_ACTION,
  server,
  runServer,
} from "../main";
import { initProject, projectExists, removeProject } from "../helper.js";
import logger from "../log.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Mock the helper functions.
mock.module("../helper.js", () => ({
  initProject: jest.fn(),
  projectExists: jest.fn(),
  removeProject: jest.fn(),
}));

// Mock the logger.
mock.module("../log.js", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

describe("List Tools Handler", () => {
  it("should return a valid tool description", async () => {
    const result = await listToolsHandler();
    expect(result).toHaveProperty("tools");
    expect(Array.isArray(result.tools)).toBe(true);
    expect(result.tools.length).toBe(1);
    const tool = result.tools[0];
    expect(tool).toHaveProperty("name", TOOL_NAME);
    expect(tool).toHaveProperty(
      "description",
      expect.stringContaining("Initialize a new project"),
    );
    expect(tool.inputSchema).toHaveProperty("type", "object");
    expect(tool.inputSchema.properties).toHaveProperty("name");
    expect(tool.inputSchema.properties).toHaveProperty("path");
    expect(tool.inputSchema.properties).toHaveProperty("action");
  });
});

describe("Call Tool Handler", () => {
  // Clear all mocks before each test.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw an error when tool name does not match", async () => {
    const invalidRequest = {
      params: {
        name: "non-existing-tool",
        arguments: {},
      },
    };
    await expect(callToolHandler(invalidRequest as any)).rejects.toThrow(
      "Tool not found",
    );
  });

  it("should throw an error when arguments are undefined", async () => {
    const invalidRequest = {
      params: {
        name: TOOL_NAME,
        arguments: undefined,
      },
    };
    await expect(callToolHandler(invalidRequest as any)).rejects.toThrow(
      "Tool not found",
    );
  });

  it("should return a required name message when name is empty", async () => {
    const req = {
      params: {
        name: TOOL_NAME,
        arguments: { name: "  ", path: "some/path", action: "create" },
      },
    };
    const result = await callToolHandler(req as any);
    expect(result.content[0].text).toMatch(/The 'name' parameter is required/);
  });

  it('should return a project exists message when the project already exists and action is "create"', async () => {
    (projectExists as jest.Mock).mockResolvedValue(true);
    const req = {
      params: {
        name: TOOL_NAME,
        arguments: {
          name: "TestProject",
          path: "custom/path",
          action: "create",
        },
      },
    };
    const result = await callToolHandler(req as any);
    expect(result.content[0].text).toMatch(
      /Project "TestProject" already exists at custom\/path/,
    );
  });

  it('should handle "replace" action correctly', async () => {
    (projectExists as jest.Mock).mockResolvedValue(true);
    (removeProject as jest.Mock).mockResolvedValue(undefined);
    (initProject as jest.Mock).mockResolvedValue(undefined);
    const req = {
      params: {
        name: TOOL_NAME,
        arguments: {
          name: "TestProject",
          path: "custom/path",
          action: "replace",
        },
      },
    };
    const result = await callToolHandler(req as any);
    expect(removeProject).toHaveBeenCalledWith("TestProject", "custom/path");
    expect(initProject).toHaveBeenCalledWith("TestProject", "custom/path");
    expect(result.content[0].text).toBe(
      `Replaced starter project: TestProject for creating an MCP server is created in ~/custom/path.`,
    );
  });

  it('should handle "create" action correctly', async () => {
    (projectExists as jest.Mock).mockResolvedValue(false);
    (initProject as jest.Mock).mockResolvedValue(undefined);
    const req = {
      params: {
        name: TOOL_NAME,
        arguments: {
          name: "NewProject",
          path: "custom/path",
          action: "create",
        },
      },
    };
    const result = await callToolHandler(req as any);
    expect(initProject).toHaveBeenCalledWith("NewProject", "custom/path");
    expect(result.content[0].text).toBe(
      `New starter project: NewProject for creating an MCP server is created in ~/custom/path.`,
    );
  });

  it("should use default values when path or action is not provided", async () => {
    (projectExists as jest.Mock).mockResolvedValue(false);
    (initProject as jest.Mock).mockResolvedValue(undefined);
    const req = {
      params: {
        name: TOOL_NAME,
        arguments: { name: "DefaultProject" }, // no path, no action provided
      },
    };
    const result = await callToolHandler(req as any);
    expect(initProject).toHaveBeenCalledWith(
      "DefaultProject",
      DEFAULT_PROJECT_PATH,
    );
    expect(result.content[0].text).toBe(
      `New starter project: DefaultProject for creating an MCP server is created in ~/${DEFAULT_PROJECT_PATH}.`,
    );
  });

  it("should return an invalid action message for an unexpected action", async () => {
    const req = {
      params: {
        name: TOOL_NAME,
        arguments: {
          name: "TestProject",
          path: "custom/path",
          action: "invalid",
        },
      },
    };
    const result = await callToolHandler(req as any);
    expect(result.content[0].text).toBe(
      `Invalid action "invalid". Use "create" or "replace".`,
    );
  });

  it("should catch errors and return an error message", async () => {
    const testError = new Error("Test error");
    (projectExists as jest.Mock).mockResolvedValue(false);
    (initProject as jest.Mock).mockRejectedValue(testError);
    const req = {
      params: {
        name: TOOL_NAME,
        arguments: {
          name: "ErrorProject",
          path: "error/path",
          action: "create",
        },
      },
    };
    const result = await callToolHandler(req as any);
    expect(result.content[0].text).toContain(
      "Error occurred while creating the project. Test error",
    );
  });
});

describe("Main Function", () => {
  let spyConnect;
  let spyLoggerInfo;

  beforeEach(() => {
    spyConnect = spyOn(server, "connect").mockResolvedValue(undefined);
    spyLoggerInfo = spyOn(logger, "info");
    // Suppress console.error so the test output stays clean.
    spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should call connect with a StdioServerTransport and log info on success", async () => {
    await main();
    expect(spyConnect).toHaveBeenCalledWith(expect.any(StdioServerTransport));
    expect(spyLoggerInfo).toHaveBeenCalledWith(
      "Create-MCP-Project Server running on stdio.",
    );
  });

  it("should catch errors in main and call logger.error then exit", async () => {
    const testErr = new Error("Connection failed");
    spyConnect.mockRejectedValue(testErr);
    const spyProcessExit = spyOn(process, "exit")
      // Instead of actually exiting, throw an error so that Jest can catch it.
      .mockImplementation((code?: number): never => {
        throw new Error("Exited with code " + code);
      });
    const spyLoggerError = spyOn(logger, "error");

    await expect(runServer()).rejects.toThrow("Exited with code 1");
    expect(spyLoggerError).toHaveBeenCalledWith(
      "Fatal error while running server:",
      testErr,
    );
    spyProcessExit.mockRestore();
  });
});
