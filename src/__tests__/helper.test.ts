import { describe, it, expect, beforeEach, jest } from "bun:test";
import path from "path";
import { ProjectHelper, FileSystem, CommandExecutor } from "../helper";
import {
  MAIN_TEXT,
  PACKAGE_JSON,
  TSCONFIG,
  PROJECT_NAME,
  ESLINT_CONFIG,
  GIT_IGNORE,
  PRETTIER_IGNORE,
  STYLELINT_CONFIG,
  README,
  GITHUB_WORKFLOWS_VERIFY,
  VSCODE_EXTENSIONS,
  VSCODE_SETTINGS,
} from "../constants";

type Mocked<T> = {
  [P in keyof T]: T[P] extends (...args: any[]) => any
    ? ReturnType<typeof jest.fn>
    : T[P];
};

describe("ProjectHelper", () => {
  let dummyFs: Mocked<FileSystem>;
  let dummyExec: Mocked<CommandExecutor>;
  let helper: ProjectHelper;
  const dummyHomeDir = "/dummy/home";
  const projectName = "MyProject";
  const projectPath = "projects";
  let root: string;
  let source: string;
  let githubWorkflows: string;
  let vscode: string;

  beforeEach(() => {
    dummyFs = {
      existsSync: jest.fn(),
      mkdirSync: jest.fn(),
      rmSync: jest.fn(),
      writeFile: jest.fn().mockResolvedValue(undefined),
      access: jest.fn().mockResolvedValue(undefined),
    };

    dummyExec = {
      execSync: jest.fn(),
    };

    helper = new ProjectHelper(dummyFs, dummyExec, path, {
      homedir: () => dummyHomeDir,
    } as any);

    root = path.join(dummyHomeDir, projectPath, projectName);
    source = path.join(root, "src");
    githubWorkflows = path.join(root, ".github", "workflows");
    vscode = path.join(root, ".vscode");

    jest.clearAllMocks();
  });

  describe("initProject", () => {
    it("creates src directory if missing, writes files, and executes commands", async () => {
      dummyFs.existsSync.mockImplementation((p: string) => {
        if (p === source || p === githubWorkflows || p === vscode) {
          return false;
        }
        return true;
      });

      await helper.initProject(projectName, projectPath);
      expect(dummyFs.mkdirSync).toHaveBeenCalledWith(source, {
        recursive: true,
      });
      expect(dummyFs.mkdirSync).toHaveBeenCalledWith(githubWorkflows, {
        recursive: true,
      });
      expect(dummyFs.mkdirSync).toHaveBeenCalledWith(vscode, {
        recursive: true,
      });

      const mainTsPath = path.join(source, "main.ts");
      const packageJsonPath = path.join(root, "package.json");
      const tsconfigPath = path.join(root, "tsconfig.json");
      const eslintConfigPath = path.join(root, "eslint.config.mjs");
      const gitIgnorePath = path.join(root, ".gitignore");
      const prettierIgnorePath = path.join(root, ".prettierignore");
      const stylelintConfigPath = path.join(root, ".stylelintrc.yml");
      const readmePath = path.join(root, "README.md");
      const githubWorkflowsVerifyPath = path.join(
        githubWorkflows,
        "verify.xml",
      );
      const vscodeExtensionsPath = path.join(vscode, "extensions.json");
      const vscodeSettingsPath = path.join(vscode, "settings.json");

      const replacedMain = MAIN_TEXT.replaceAll(
        PROJECT_NAME,
        projectName,
      ).trimStart();
      const replacedPackageJson = PACKAGE_JSON.replaceAll(
        PROJECT_NAME,
        projectName,
      ).trimStart();
      const replacedTsconfig = TSCONFIG.replaceAll(
        PROJECT_NAME,
        projectName,
      ).trimStart();
      const replacedEslintConfig = ESLINT_CONFIG.replaceAll(
        PROJECT_NAME,
        projectName,
      ).trimStart();
      const replacedGitIgnore = GIT_IGNORE.replaceAll(
        PROJECT_NAME,
        projectName,
      ).trimStart();
      const replacedPrettierIgnore = PRETTIER_IGNORE.replaceAll(
        PROJECT_NAME,
        projectName,
      ).trimStart();
      const replacedStylelintConfig = STYLELINT_CONFIG.replaceAll(
        PROJECT_NAME,
        projectName,
      ).trimStart();
      const replacedReadme = README.replaceAll(
        PROJECT_NAME,
        projectName,
      ).trimStart();
      const replacedGithubWorkflowsVerify = GITHUB_WORKFLOWS_VERIFY.replaceAll(
        PROJECT_NAME,
        projectName,
      ).trimStart();
      const replacedVscodeExtensions = VSCODE_EXTENSIONS.replaceAll(
        PROJECT_NAME,
        projectName,
      ).trimStart();
      const replacedVscodeSettings = VSCODE_SETTINGS.replaceAll(
        PROJECT_NAME,
        projectName,
      ).trimStart();

      expect(dummyFs.writeFile).toHaveBeenCalledWith(
        mainTsPath,
        replacedMain,
        "utf8",
      );
      expect(dummyFs.writeFile).toHaveBeenCalledWith(
        packageJsonPath,
        replacedPackageJson,
        "utf8",
      );
      expect(dummyFs.writeFile).toHaveBeenCalledWith(
        tsconfigPath,
        replacedTsconfig,
        "utf8",
      );
      expect(dummyFs.writeFile).toHaveBeenCalledWith(
        eslintConfigPath,
        replacedEslintConfig,
        "utf8",
      );
      expect(dummyFs.writeFile).toHaveBeenCalledWith(
        gitIgnorePath,
        replacedGitIgnore,
        "utf8",
      );
      expect(dummyFs.writeFile).toHaveBeenCalledWith(
        prettierIgnorePath,
        replacedPrettierIgnore,
        "utf8",
      );
      expect(dummyFs.writeFile).toHaveBeenCalledWith(
        stylelintConfigPath,
        replacedStylelintConfig,
        "utf8",
      );
      expect(dummyFs.writeFile).toHaveBeenCalledWith(
        readmePath,
        replacedReadme,
        "utf8",
      );
      expect(dummyFs.writeFile).toHaveBeenCalledWith(
        githubWorkflowsVerifyPath,
        replacedGithubWorkflowsVerify,
        "utf8",
      );
      expect(dummyFs.writeFile).toHaveBeenCalledWith(
        vscodeExtensionsPath,
        replacedVscodeExtensions,
        "utf8",
      );
      expect(dummyFs.writeFile).toHaveBeenCalledWith(
        vscodeSettingsPath,
        replacedVscodeSettings,
        "utf8",
      );

      expect(dummyExec.execSync).toHaveBeenCalledWith("bun install", {
        cwd: root,
      });
      expect(dummyExec.execSync).toHaveBeenCalledWith("bun run verify", {
        cwd: root,
      });
      expect(dummyExec.execSync).toHaveBeenCalledWith("bun run build", {
        cwd: root,
      });
    });

    it("skips creating src directory if it exists", async () => {
      dummyFs.existsSync.mockReturnValue(true);

      await helper.initProject(projectName, projectPath);

      expect(dummyFs.mkdirSync).not.toHaveBeenCalled();
    });

    it("throws an error if writing a file fails", async () => {
      dummyFs.existsSync.mockReturnValue(true);
      dummyFs.writeFile.mockRejectedValue(new Error("Write failed"));

      await expect(
        helper.initProject(projectName, projectPath),
      ).rejects.toThrow("Write failed");
    });

    it("throws an error if command execution fails", async () => {
      dummyFs.existsSync.mockImplementation((p: string) =>
        p === source ? false : true,
      );
      dummyFs.writeFile.mockResolvedValue(undefined);

      dummyExec.execSync.mockImplementation((command: string) => {
        if (command === "bun install") throw new Error("Command failed");
      });

      await expect(
        helper.initProject(projectName, projectPath),
      ).rejects.toThrow("Command failed");
    });
  });

  describe("removeProject", () => {
    it("removes the project directory if it exists", async () => {
      dummyFs.existsSync.mockImplementation((p: string) => p === root);

      await helper.removeProject(projectName, projectPath);

      expect(dummyFs.rmSync).toHaveBeenCalledWith(root, {
        recursive: true,
        force: true,
      });
    });

    it("does nothing if the project directory does not exist", async () => {
      dummyFs.existsSync.mockReturnValue(false);

      await helper.removeProject(projectName, projectPath);

      expect(dummyFs.rmSync).not.toHaveBeenCalled();
    });
  });

  describe("projectExists", () => {
    it("returns true if the project directory is accessible", async () => {
      dummyFs.access.mockResolvedValue(undefined);

      const exists = await helper.projectExists(projectName, projectPath);

      expect(exists).toBe(true);
      expect(dummyFs.access).toHaveBeenCalledWith(root);
    });

    it("returns false if the project directory is not accessible", async () => {
      dummyFs.access.mockRejectedValue(new Error("Not exist"));

      const exists = await helper.projectExists(projectName, projectPath);

      expect(exists).toBe(false);
      expect(dummyFs.access).toHaveBeenCalledWith(root);
    });
  });

  describe("writeContent", () => {
    it("writes content successfully", async () => {
      const destination = "dummy/path.txt";
      const content = "Hello, world!";
      await (helper as any).writeContent(content, destination);
      expect(dummyFs.writeFile).toHaveBeenCalledWith(
        destination,
        content,
        "utf8",
      );
    });

    it("catches and rethrows error when writeFile fails", async () => {
      const destination = "dummy/path.txt";
      dummyFs.writeFile.mockRejectedValue(new Error("File write error"));
      await expect(
        (helper as any).writeContent("Test", destination),
      ).rejects.toThrow("File write error");
    });
  });

  describe("executeCommand", () => {
    it("executes a command successfully", () => {
      (helper as any).executeCommand("echo hello", root);
      expect(dummyExec.execSync).toHaveBeenCalledWith("echo hello", {
        cwd: root,
      });
    });

    it("throws an error if execSync fails", () => {
      dummyExec.execSync.mockImplementation(() => {
        throw new Error("Exec failure");
      });
      expect(() => (helper as any).executeCommand("fail", root)).toThrow(
        "Exec failure",
      );
    });
  });
});
