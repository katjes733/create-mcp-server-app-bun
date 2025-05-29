import pathModule from "path";
import os from "os";
import { execSync } from "child_process";
import { writeFile } from "fs/promises";
import * as fs from "fs";
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
} from "./constants.js";

/* eslint-disable no-unused-vars */
export interface FileSystem {
  existsSync: (path: string) => boolean;
  mkdirSync: (path: string, options?: { recursive?: boolean }) => void;
  rmSync: (
    path: string,
    options?: { recursive?: boolean; force?: boolean },
  ) => void;
  writeFile: typeof writeFile;
  access: (path: string) => Promise<void>;
}

export interface CommandExecutor {
  execSync: (command: string, options: { cwd: string | undefined }) => void;
}
/* eslint-enable no-unused-vars */

const defaultFs: FileSystem = {
  existsSync: fs.existsSync,
  mkdirSync: fs.mkdirSync,
  rmSync: fs.rmSync,
  writeFile: writeFile,
  access: fs.promises.access,
};

const defaultExecutor: CommandExecutor = {
  execSync: execSync,
};

export class ProjectHelper {
  private fs: FileSystem;
  private exec: CommandExecutor;
  private path: typeof pathModule;
  private homeDir: string;

  constructor(
    fsDep: FileSystem = defaultFs,
    execDep: CommandExecutor = defaultExecutor,
    pathDep: typeof pathModule = pathModule,
    osDep = os,
  ) {
    this.fs = fsDep;
    this.exec = execDep;
    this.path = pathDep;
    this.homeDir = osDep.homedir();
  }

  async initProject(projectName: string, projectPath: string): Promise<void> {
    const root = this.path.join(this.homeDir, projectPath, projectName);
    const source = this.path.join(root, "src");
    const githubWorkflows = this.path.join(root, ".github", "workflows");
    const vscode = this.path.join(root, ".vscode");

    if (!this.fs.existsSync(source)) {
      this.fs.mkdirSync(source, { recursive: true });
    }

    if (!this.fs.existsSync(githubWorkflows)) {
      this.fs.mkdirSync(githubWorkflows, { recursive: true });
    }

    if (!this.fs.existsSync(vscode)) {
      this.fs.mkdirSync(vscode, { recursive: true });
    }

    await this.writeContent(
      MAIN_TEXT.replaceAll(PROJECT_NAME, projectName),
      this.path.join(source, "main.ts"),
    );
    await this.writeContent(
      PACKAGE_JSON.replaceAll(PROJECT_NAME, projectName),
      this.path.join(root, "package.json"),
    );
    await this.writeContent(
      TSCONFIG.replaceAll(PROJECT_NAME, projectName),
      this.path.join(root, "tsconfig.json"),
    );
    await this.writeContent(
      ESLINT_CONFIG.replaceAll(PROJECT_NAME, projectName),
      this.path.join(root, "eslint.config.mjs"),
    );
    await this.writeContent(
      GIT_IGNORE.replaceAll(PROJECT_NAME, projectName),
      this.path.join(root, ".gitignore"),
    );
    await this.writeContent(
      PRETTIER_IGNORE.replaceAll(PROJECT_NAME, projectName),
      this.path.join(root, ".prettierignore"),
    );
    await this.writeContent(
      STYLELINT_CONFIG.replaceAll(PROJECT_NAME, projectName),
      this.path.join(root, ".stylelintrc.yml"),
    );
    await this.writeContent(
      README.replaceAll(PROJECT_NAME, projectName),
      this.path.join(root, "README.md"),
    );
    await this.writeContent(
      GITHUB_WORKFLOWS_VERIFY.replaceAll(PROJECT_NAME, projectName),
      this.path.join(githubWorkflows, "verify.xml"),
    );
    await this.writeContent(
      VSCODE_EXTENSIONS.replaceAll(PROJECT_NAME, projectName),
      this.path.join(vscode, "extensions.json"),
    );
    await this.writeContent(
      VSCODE_SETTINGS.replaceAll(PROJECT_NAME, projectName),
      this.path.join(vscode, "settings.json"),
    );

    this.executeCommand("bun install", root);
    this.executeCommand("bun run verify", root);
    this.executeCommand("bun run build", root);
  }

  async removeProject(projectName: string, projectPath: string): Promise<void> {
    const root = this.path.join(this.homeDir, projectPath, projectName);
    if (this.fs.existsSync(root)) {
      this.fs.rmSync(root, { recursive: true, force: true });
    }
  }

  async projectExists(
    projectName: string,
    projectPath: string,
  ): Promise<boolean> {
    try {
      const root = this.path.join(this.homeDir, projectPath, projectName);
      await this.fs.access(root);
      return true;
    } catch {
      return false;
    }
  }

  protected async writeContent(
    content: string,
    destination: string,
  ): Promise<void> {
    try {
      await this.fs.writeFile(destination, content.trimStart(), "utf8");
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
    }
  }

  protected executeCommand(command: string, cwd: string | undefined): void {
    try {
      this.exec.execSync(command, { cwd });
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
    }
  }
}
