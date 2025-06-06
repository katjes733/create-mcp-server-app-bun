import {
  describe,
  it,
  expect,
  beforeEach,
  jest,
  afterEach,
  spyOn,
  mock,
} from "bun:test";
import {
  CreateMcpProject,
  DEFAULT_ACTION,
  DEFAULT_PROJECT_PATH,
} from "~/tools/CreateMcpProject";
import dedent from "dedent";
import path from "path";

const mockFetch = jest.fn();

const mockJoin = jest.fn();
const mockDirname = jest.fn();
const mockPathModule = {
  join: mockJoin,
  dirname: mockDirname,
};

const mockExistsSync = jest.fn();
const mockRmSync = jest.fn();
const mockMkdirSync = jest.fn();
const mockWriteFileSync = jest.fn();
const mockReadFileSync = jest.fn();
const mockFsModule = {
  existsSync: mockExistsSync,
  rmSync: mockRmSync,
  mkdirSync: mockMkdirSync,
  writeFileSync: mockWriteFileSync,
  readFileSync: mockReadFileSync,
};

const mockExecSync = jest.fn();
const mockCpModule = {
  execSync: mockExecSync,
};

mock.module("~/tools-config/CreateMcpProjectConfig", () => ({
  PROJECT_NAME: "${PROJECT_NAME}",
  FILES: [
    { filename: "package.json", content: "package.json" },
    { filename: ".gitignore", content: "build" },
    { filename: "README.md", relativePath: ".", content: "# ${PROJECT_NAME}" },
    { filename: "main.ts", relativePath: "src" },
  ],
  SCRIPTS: [
    { command: "install" },
    { command: "build", workingDirectory: "/foo/bar" },
  ],
}));

function createInstance() {
  const instance = new CreateMcpProject(
    mockFetch as unknown as typeof globalThis.fetch,
  );
  return instance;
}

function createMockedInstance() {
  const instance = new CreateMcpProject(
    mockFetch as unknown as typeof globalThis.fetch,
    mockPathModule as unknown as typeof import("path"),
    mockFsModule as unknown as typeof import("fs"),
    mockCpModule as unknown as typeof import("child_process"),
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
    mockJoin.mockReset();
    mockDirname.mockReset();
    mockExistsSync.mockReset();
    mockRmSync.mockReset();
    mockMkdirSync.mockReset();
    mockWriteFileSync.mockReset();
    mockReadFileSync.mockReset();
    mockExecSync.mockReset();
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

  it("validateWithDefaults accepts valid parameters", () => {
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

  it("validateWithDefaults throws on invalid parameters", () => {
    const tool = createInstance();
    expect(() =>
      tool.validateWithDefaults({
        name: 1234,
        projectPath: "custom/path",
        action: "replace",
      }),
    ).toThrow("Invalid project name");
    expect(() =>
      tool.validateWithDefaults({
        name: "",
        projectPath: "custom/path",
        action: "replace",
      }),
    ).toThrow("Invalid project name");
    expect(() =>
      tool.validateWithDefaults({
        name: "dummy-mcp-project",
        projectPath: 1234,
        action: "replace",
      }),
    ).toThrow("Invalid project path");
    expect(() =>
      tool.validateWithDefaults({
        name: "dummy-mcp-project",
        projectPath: "custom\0/path",
        action: "replace",
      }),
    ).toThrow("Invalid project path");
    expect(() =>
      tool.validateWithDefaults({
        name: "dummy-mcp-project",
        projectPath: "custom/path",
        action: 1234,
      }),
    ).toThrow("Invalid action");
    expect(() =>
      tool.validateWithDefaults({
        name: "dummy-mcp-project",
        projectPath: "custom/path",
        action: "substitute",
      }),
    ).toThrow("Invalid action");
  });

  it("processToolWorkflow returns correct content for valid replace of existing project", async () => {
    const tool = createInstance();
    const projectExistsSpy = spyOn(tool as any, "projectExists");
    const removeProjectSpy = spyOn(tool as any, "removeProject");
    const initProjectSpy = spyOn(tool as any, "initProject");

    projectExistsSpy.mockResolvedValue(false);
    removeProjectSpy.mockResolvedValue(undefined);
    initProjectSpy.mockResolvedValue(undefined);

    const result = await tool.processToolWorkflow({
      name: "dummy-mcp-project",
      projectPath: "/custom/path",
      action: "replace",
    });
    expect(projectExistsSpy).toHaveBeenCalledWith(
      "dummy-mcp-project",
      "/custom/path",
    );
    expect(removeProjectSpy).toHaveBeenCalledWith(
      "dummy-mcp-project",
      "/custom/path",
    );
    expect(initProjectSpy).toHaveBeenCalledWith(
      "dummy-mcp-project",
      "/custom/path",
    );
    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: 'Replaced starter project: "dummy-mcp-project" for creating an MCP server is created in ~/custom/path.',
        },
      ],
    });
  });

  it("processToolWorkflow returns correct content to decide on next action", async () => {
    const tool = createInstance();
    const projectExistsSpy = spyOn(tool as any, "projectExists");

    projectExistsSpy.mockResolvedValue(true);

    const result = await tool.processToolWorkflow({
      name: "dummy-mcp-project",
      projectPath: "/custom/path",
      action: "create",
    });
    expect(projectExistsSpy).toHaveBeenCalledWith(
      "dummy-mcp-project",
      "/custom/path",
    );
    expect(result).toEqual({
      content: [
        {
          type: "text",
          text:
            'Project "dummy-mcp-project" already exists at ~/custom/path. ' +
            "Always ask to what action the user wants to do next: replace/overwrite existing or create project with different name." +
            'Please resubmit with "action": "replace" to overwrite, or have user provide a new project name.',
        },
      ],
    });
  });

  it("processToolWorkflow returns correct content for valid create of new project", async () => {
    const tool = createInstance();
    const projectExistsSpy = spyOn(tool as any, "projectExists");
    const initProjectSpy = spyOn(tool as any, "initProject");

    projectExistsSpy.mockResolvedValue(false);
    initProjectSpy.mockResolvedValue(undefined);

    const result = await tool.processToolWorkflow({
      name: "dummy-mcp-project",
      projectPath: "/custom/path",
      action: "create",
    });
    expect(projectExistsSpy).toHaveBeenCalledWith(
      "dummy-mcp-project",
      "/custom/path",
    );
    expect(initProjectSpy).toHaveBeenCalledWith(
      "dummy-mcp-project",
      "/custom/path",
    );
    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: 'New starter project: "dummy-mcp-project" for creating an MCP server is created in ~/custom/path.',
        },
      ],
    });
  });

  it("processToolWorkflow returns error content on incorrect action", async () => {
    const tool = createInstance();
    const projectExistsSpy = spyOn(tool as any, "projectExists");

    projectExistsSpy.mockResolvedValue(false);

    const result = await tool.processToolWorkflow({
      name: "dummy-mcp-project",
      projectPath: "/custom/path",
      action: "other",
    });
    expect(projectExistsSpy).toHaveBeenCalledWith(
      "dummy-mcp-project",
      "/custom/path",
    );
    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: 'Invalid action "other". Use "create" or "replace".',
        },
      ],
    });
  });

  it("processToolWorkflow returns error on failure with Error", async () => {
    const tool = createInstance();
    const projectExistsSpy = spyOn(tool as any, "projectExists");
    const initProjectSpy = spyOn(tool as any, "initProject");

    projectExistsSpy.mockResolvedValue(false);
    initProjectSpy.mockRejectedValue(new Error("Init error."));

    const result = await tool.processToolWorkflow({
      name: "dummy-mcp-project",
      projectPath: "/custom/path",
      action: "create",
    });
    expect(projectExistsSpy).toHaveBeenCalledWith(
      "dummy-mcp-project",
      "/custom/path",
    );
    expect(initProjectSpy).toHaveBeenCalledWith(
      "dummy-mcp-project",
      "/custom/path",
    );
    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: "Error occurred while creating the project. Init error.",
        },
      ],
    });
  });

  it("processToolWorkflow returns error on failure with something other than Error", async () => {
    const tool = createInstance();
    const projectExistsSpy = spyOn(tool as any, "projectExists");
    const initProjectSpy = spyOn(tool as any, "initProject");

    projectExistsSpy.mockResolvedValue(false);
    initProjectSpy.mockImplementation(() => {
      throw "fail-string";
    });

    const result = await tool.processToolWorkflow({
      name: "dummy-mcp-project",
      projectPath: "/custom/path",
      action: "create",
    });
    expect(projectExistsSpy).toHaveBeenCalledWith(
      "dummy-mcp-project",
      "/custom/path",
    );
    expect(initProjectSpy).toHaveBeenCalledWith(
      "dummy-mcp-project",
      "/custom/path",
    );
    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: "Error occurred while creating the project.",
        },
      ],
    });
  });

  it("projectExists returns true if found", async () => {
    const tool = createMockedInstance();
    mockJoin.mockReturnValue("/home/user/custom/path/dummy-mcp-project");
    mockExistsSync.mockReturnValue(true);
    await expect(
      tool["projectExists"]("dummy-mcp-project", "/custom/path"),
    ).resolves.toBe(true);
    expect(mockExistsSync).toHaveBeenCalledWith(
      "/home/user/custom/path/dummy-mcp-project",
    );
  });

  it("projectExists returns false if found", async () => {
    const tool = createMockedInstance();
    mockJoin.mockReturnValue("/home/user/custom/path/dummy-mcp-project");
    mockExistsSync.mockReturnValue(false);
    await expect(
      tool["projectExists"]("dummy-mcp-project", "/custom/path"),
    ).resolves.toBe(false);
    expect(mockExistsSync).toHaveBeenCalledWith(
      "/home/user/custom/path/dummy-mcp-project",
    );
  });

  it("removeProject removes project if it exists", async () => {
    const tool = createMockedInstance();
    mockJoin.mockReturnValue("/home/user/custom/path/dummy-mcp-project");
    mockExistsSync.mockReturnValue(true);
    mockRmSync.mockImplementation(() => {});
    await tool["removeProject"]("dummy-mcp-project", "/custom/path");
    expect(mockExistsSync).toHaveBeenCalledWith(
      "/home/user/custom/path/dummy-mcp-project",
    );
    expect(mockRmSync).toHaveBeenCalledWith(
      "/home/user/custom/path/dummy-mcp-project",
      { recursive: true, force: true },
    );
  });

  it("removeProject does not remove project if does not exist", async () => {
    const tool = createMockedInstance();
    mockJoin.mockReturnValue("/home/user/custom/path/dummy-mcp-project");
    mockExistsSync.mockReturnValue(false);
    await tool["removeProject"]("dummy-mcp-project", "/custom/path");
    expect(mockExistsSync).toHaveBeenCalledWith(
      "/home/user/custom/path/dummy-mcp-project",
    );
    expect(mockRmSync).not.toHaveBeenCalled();
  });

  it("initProject initializes project at correct path", async () => {
    const tool = createMockedInstance();
    mockJoin.mockReturnValue("/home/user/custom/path/dummy-mcp-project");
    const createDirectoriesSpy = spyOn(tool as any, "createDirectories");
    const createFilesSpy = spyOn(tool as any, "createFiles");
    const executeScriptsSpy = spyOn(tool as any, "executeScripts");
    createDirectoriesSpy.mockImplementation(() => {});
    createFilesSpy.mockImplementation(() => {});
    executeScriptsSpy.mockImplementation(() => {});
    await tool["initProject"]("dummy-mcp-project", "/custom/path");
    expect(createDirectoriesSpy).toHaveBeenCalledWith(
      "/home/user/custom/path/dummy-mcp-project",
    );
    expect(createFilesSpy).toHaveBeenCalledWith(
      "/home/user/custom/path/dummy-mcp-project",
      "dummy-mcp-project",
    );
    expect(executeScriptsSpy).toHaveBeenCalledWith(
      "/home/user/custom/path/dummy-mcp-project",
    );
  });

  it("createDirectories creates all directories including root", async () => {
    const tool = createMockedInstance();
    mockExistsSync
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);
    mockMkdirSync.mockImplementation(() => {});
    mockJoin.mockImplementation((...args) => path.join(...args));

    await tool["createDirectories"]("/home/user/custom/path/dummy-mcp-project");
    expect(mockMkdirSync).toHaveBeenCalledTimes(2);
    expect(mockMkdirSync).toHaveBeenNthCalledWith(
      1,
      "/home/user/custom/path/dummy-mcp-project",
      { recursive: true },
    );
    expect(mockMkdirSync).toHaveBeenNthCalledWith(
      2,
      "/home/user/custom/path/dummy-mcp-project/src",
      { recursive: true },
    );
  });

  it("createDirectories creates all directories excluding root", async () => {
    const tool = createMockedInstance();
    mockExistsSync
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);
    mockMkdirSync.mockImplementation(() => {});
    mockJoin.mockImplementation((...args) => path.join(...args));

    await tool["createDirectories"]("/home/user/custom/path/dummy-mcp-project");
    expect(mockMkdirSync).toHaveBeenCalledTimes(1);
    expect(mockMkdirSync).toHaveBeenNthCalledWith(
      1,
      "/home/user/custom/path/dummy-mcp-project/src",
      { recursive: true },
    );
  });

  it("createFiles creates files with correct content", async () => {
    const tool = createMockedInstance();
    const getProjectRootSpy = spyOn(tool as any, "getProjectRoot");
    mockJoin.mockImplementation((...args) => path.join(...args));
    mockExistsSync
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true)
      .mockReturnValue(false);
    mockWriteFileSync.mockImplementation(() => {});
    getProjectRootSpy.mockReturnValue(
      "/home/user/custom/path/dummy-mcp-project",
    );
    mockReadFileSync.mockImplementation(
      () =>
        '// ${PROJECT_NAME}\nimport path from "path";\n\nconsole.log("Hello, Test!");\n',
    );

    await tool["createFiles"](
      "/home/user/custom/path/dummy-mcp-project",
      "dummy-mcp-project",
    );

    expect(mockWriteFileSync).toHaveBeenCalledTimes(3);
    expect(mockWriteFileSync).toHaveBeenNthCalledWith(
      1,
      "/home/user/custom/path/dummy-mcp-project/package.json",
      "package.json\n",
      "utf-8",
    );
    expect(mockWriteFileSync).toHaveBeenNthCalledWith(
      2,
      "/home/user/custom/path/dummy-mcp-project/README.md",
      "# dummy-mcp-project\n",
      "utf-8",
    );
    expect(mockWriteFileSync).toHaveBeenNthCalledWith(
      3,
      "/home/user/custom/path/dummy-mcp-project/src/main.ts",
      '// dummy-mcp-project\nimport path from "path";\n\nconsole.log("Hello, Test!");\n',
      "utf-8",
    );
  });

  it("getProjectRoot returns the correct directory when package.json is found", () => {
    const tool = createMockedInstance();
    const getImportMetaPathSpy = spyOn(tool as any, "getImportMetaPath");
    getImportMetaPathSpy.mockReturnValue("/foo/bar/baz/file.js");
    mockJoin.mockImplementation((...args) => path.join(...args));
    mockDirname.mockImplementation((arg: string) => path.dirname(arg));
    mockExistsSync.mockImplementation(
      (filePath) => filePath === "/foo/package.json",
    );

    const result = tool["getProjectRoot"]();
    expect(result).toBe("/foo");
  });

  it("getProjectRoot throws if project root is not found", () => {
    const tool = createMockedInstance();
    const getImportMetaPathSpy = spyOn(tool as any, "getImportMetaPath");
    getImportMetaPathSpy.mockReturnValue("/foo/bar/baz/file.js");
    mockJoin.mockImplementation((...args) => path.join(...args));
    mockDirname.mockImplementation((arg: string) => path.dirname(arg));
    mockExistsSync.mockImplementation(() => false);

    expect(() => tool["getProjectRoot"]()).toThrow("Project root not found.");
  });

  it("getProjectRoot returns cached projectRoot if already set", () => {
    const tool = createMockedInstance();
    (tool as any).projectRoot = "/already/found";
    const result = tool["getProjectRoot"]();
    expect(result).toBe("/already/found");
  });

  it("getImportMetaPath returns valid string", () => {
    const tool = createMockedInstance();
    const result = tool["getImportMetaPath"]();
    expect(result).not.toBeNull();
    expect(result).toBeString();
  });

  it("executeScripts returns executes scripts correctly", () => {
    const tool = createMockedInstance();
    const executeCommandSpy = spyOn(tool as any, "executeCommand");
    executeCommandSpy.mockImplementation(() => {});
    mockJoin.mockImplementation((...args) => path.join(...args));

    tool["executeScripts"]("/project/test");
    expect(executeCommandSpy).toHaveBeenCalledTimes(2);
    expect(executeCommandSpy).toHaveBeenNthCalledWith(
      1,
      "install",
      "/project/test",
    );
    expect(executeCommandSpy).toHaveBeenNthCalledWith(2, "build", "/foo/bar");
  });

  it("executeCommand returns executes command correctly with cwd", () => {
    const tool = createMockedInstance();
    mockExecSync.mockImplementation(() => {});

    tool["executeCommand"]("install", "/foo/bar");
    expect(mockExecSync).toHaveBeenCalledWith("install", { cwd: "/foo/bar" });
  });

  it("executeCommand returns executes command correctly without cwd", () => {
    const tool = createMockedInstance();
    mockExecSync.mockImplementation(() => {});

    tool["executeCommand"]("install");
    expect(mockExecSync).toHaveBeenCalledWith("install", {});
  });

  it("executeCommand throws correct Error", () => {
    const tool = createMockedInstance();
    mockExecSync.mockImplementation(() => {
      throw new Error("original error");
    });

    expect(() => tool["executeCommand"]("install")).toThrow(
      "Failed to execute command: install",
    );
  });
});
