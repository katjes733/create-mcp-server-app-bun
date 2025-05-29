import {
  describe,
  it,
  expect,
  beforeEach,
  jest,
  spyOn,
  afterEach,
} from "bun:test";
import {
  main,
  runServer,
  listToolsHandler,
  callToolHandler,
  server,
  TOOL_NAME,
} from "../main";
import { ProjectHelper } from "../helper";
import logger from "../log";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

describe("Main Module", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("listToolsHandler", () => {
    it("returns a valid tool listing", async () => {
      const result = await listToolsHandler();
      expect(result).toHaveProperty("tools");
      expect(Array.isArray(result.tools)).toBe(true);
      expect(result.tools[0].name).toBe(TOOL_NAME);
      expect(result.tools[0].description).toContain("Initialize a new project");
      expect(result.tools[0].inputSchema).toHaveProperty("type", "object");
      expect(result.tools[0].inputSchema.properties).toHaveProperty("name");
      expect(result.tools[0].inputSchema.properties).toHaveProperty("path");
      expect(result.tools[0].inputSchema.properties).toHaveProperty("action");
    });
  });

  describe("callToolHandler", () => {
    it("throws an error when tool name does not match", async () => {
      const req = { params: { name: "invalid-tool", arguments: {} } };
      await expect(callToolHandler(req as any)).rejects.toThrow(
        "Tool not found",
      );
    });

    it("throws an error when arguments are undefined", async () => {
      const req = { params: { name: TOOL_NAME, arguments: undefined } };
      await expect(callToolHandler(req as any)).rejects.toThrow(
        "Tool not found",
      );
    });

    it("returns a required name prompt when name is empty", async () => {
      const req = {
        params: {
          name: TOOL_NAME,
          arguments: { name: "   ", path: "some/path", action: "create" },
        },
      };
      const result = await callToolHandler(req as any);
      expect(result.content[0].text).toMatch(
        /The 'name' parameter is required/,
      );
    });

    it("returns a project exists message when project exists and action is create", async () => {
      const existsSpy = spyOn(
        ProjectHelper.prototype,
        "projectExists",
      ).mockResolvedValue(true);

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
      existsSpy.mockRestore();
    });

    it("handles the replace action correctly", async () => {
      const existsSpy = spyOn(
        ProjectHelper.prototype,
        "projectExists",
      ).mockResolvedValue(false);
      const removeSpy = spyOn(
        ProjectHelper.prototype,
        "removeProject",
      ).mockResolvedValue(undefined);
      const initSpy = spyOn(
        ProjectHelper.prototype,
        "initProject",
      ).mockResolvedValue(undefined);

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
      expect(removeSpy).toHaveBeenCalledWith("TestProject", "custom/path");
      expect(initSpy).toHaveBeenCalledWith("TestProject", "custom/path");
      expect(result.content[0].text).toBe(
        `Replaced starter project: TestProject for creating an MCP server is created in ~/custom/path.`,
      );
      existsSpy.mockRestore();
      removeSpy.mockRestore();
      initSpy.mockRestore();
    });

    it("handles the create action correctly", async () => {
      const existsSpy = spyOn(
        ProjectHelper.prototype,
        "projectExists",
      ).mockResolvedValue(false);
      const initSpy = spyOn(
        ProjectHelper.prototype,
        "initProject",
      ).mockResolvedValue(undefined);

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
      expect(initSpy).toHaveBeenCalledWith("NewProject", "custom/path");
      expect(result.content[0].text).toBe(
        `New starter project: NewProject for creating an MCP server is created in ~/custom/path.`,
      );
      existsSpy.mockRestore();
      initSpy.mockRestore();
    });

    it("returns an invalid action message for unrecognized action", async () => {
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

    it("catches errors during project initialization and returns an error message", async () => {
      const existsSpy = spyOn(
        ProjectHelper.prototype,
        "projectExists",
      ).mockResolvedValue(false);
      const initSpy = spyOn(
        ProjectHelper.prototype,
        "initProject",
      ).mockRejectedValue(new Error("Init error"));

      const req = {
        params: {
          name: TOOL_NAME,
          arguments: {
            name: "ErrorProject",
            path: "custom/path",
            action: "create",
          },
        },
      };
      const result = await callToolHandler(req as any);
      expect(result.content[0].text).toContain(
        "Error occurred while creating the project. Init error",
      );

      existsSpy.mockRestore();
      initSpy.mockRestore();
    });
  });

  describe("main and runServer", () => {
    let connectSpy;
    let infoSpy;

    beforeEach(() => {
      connectSpy = spyOn(server, "connect").mockResolvedValue(undefined);
      infoSpy = spyOn(logger, "info");
    });

    afterEach(() => {
      connectSpy.mockRestore();
      infoSpy.mockRestore();
    });

    it("main calls connect on transport and logs info", async () => {
      await main();
      expect(connectSpy).toHaveBeenCalledWith(expect.any(StdioServerTransport));
      expect(infoSpy).toHaveBeenCalledWith(
        "Create-MCP-Project Server running on stdio.",
      );
    });

    it("runServer catches errors from main, logs them, and calls process.exit", async () => {
      connectSpy.mockRejectedValue(new Error("Connection failed"));
      const errorSpy = spyOn(logger, "error");
      const exitSpy = spyOn(process, "exit").mockImplementation(
        (code?: number): never => {
          throw new Error("Exited with code " + code);
        },
      );
      await expect(runServer()).rejects.toThrow("Exited with code");
      expect(errorSpy).toHaveBeenCalledWith(
        "Fatal error while running server:",
        new Error("Connection failed"),
      );
      exitSpy.mockRestore();
    });
  });
});
