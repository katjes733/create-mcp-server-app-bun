import { AbstractTool } from "~/types/AbstractTool";
import type { ITool } from "~/types/ITool";
import { ToolValidationError } from "~/errors/ToolValidationError";
import {
  FILES,
  PROJECT_NAME,
  SCRIPTS,
} from "~/tools-config/CreateMcpProjectConfig";
import dedent from "dedent";
import path from "path";
import * as fs from "fs";
import os from "os";
import * as cp from "child_process";

export const DEFAULT_PROJECT_PATH = "Documents/projects";
export const DEFAULT_ACTION = "create";

export class CreateMcpProject extends AbstractTool implements ITool {
  private pathModule: typeof path;
  private fsModule: typeof fs;
  private cpModule: typeof cp;
  private osModule: typeof os;
  private homeDir: string;

  private projectRoot!: string;

  constructor(
    fetch: typeof globalThis.fetch = globalThis.fetch,
    pathModule: typeof path = path,
    fsModule: typeof fs = fs,
    cpModule: typeof cp = cp,
    osModule: typeof os = os,
  ) {
    super(fetch);
    this.pathModule = pathModule;
    this.fsModule = fsModule;
    this.cpModule = cpModule;
    this.osModule = osModule;
    this.homeDir = this.osModule.homedir();
  }

  getName(): string {
    return "create-mcp-project";
  }

  getDescription(): string {
    return dedent`
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
  }

  getInputSchema(): {
    type: string;
    properties: Record<string, any>;
    required: string[];
  } {
    return {
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
  }

  validateWithDefaults(params: Record<string, any>): Record<string, any> {
    const { name } = params;
    let { projectPath, action } = params;

    if (typeof name !== "string" || name.trim() === "") {
      throw new ToolValidationError(
        `Invalid project name "${name}". Ask user for a valid project name.`,
      );
    }

    if (!projectPath) {
      projectPath = DEFAULT_PROJECT_PATH;
    }
    if (typeof projectPath !== "string") {
      throw new ToolValidationError(
        `Invalid project path "${projectPath}". Ask user for a valid project path.`,
      );
    }
    projectPath = this.pathModule.join("/", projectPath);
    if (
      !this.pathModule.isAbsolute(projectPath) ||
      projectPath.includes("\0")
    ) {
      throw new ToolValidationError(
        `Invalid project path "${projectPath}". Ask user for a valid project path.`,
      );
    }

    if (!action) {
      action = DEFAULT_ACTION;
    }
    if (action !== "create" && action !== "replace") {
      throw new ToolValidationError(
        `Invalid action "${action}". Ask user for a valid action ("create" or "replace").`,
      );
    }

    return { name, projectPath, action };
  }

  async processToolWorkflow(params: Record<string, any>): Promise<{
    content: {
      type: string;
      text: string;
      annotations?: Record<string, any>;
    }[];
  }> {
    const { name, projectPath, action } = params;

    const projectExists = await this.projectExists(name, projectPath);
    if (projectExists && action === "create") {
      return {
        content: [
          {
            type: "text",
            text:
              `Project "${name}" already exists at ~${projectPath}. ` +
              `Always ask to what action the user wants to do next: replace/overwrite existing or create project with different name.` +
              `Please resubmit with "action": "replace" to overwrite, or have user provide a new project name.`,
          },
        ],
      };
    }

    try {
      let text: string;
      if (action === "replace") {
        await this.removeProject(name, projectPath);
        text = `Replaced starter project: "${name}" for creating an MCP server is created in ~${projectPath}.`;
      } else if (action === "create") {
        text = `New starter project: "${name}" for creating an MCP server is created in ~${projectPath}.`;
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
      await this.initProject(name, projectPath);
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

  private async projectExists(
    projectName: string,
    projectPath: string,
  ): Promise<boolean> {
    const fullProjectPath = this.pathModule.join(
      this.homeDir,
      projectPath,
      projectName,
    );
    return this.fsModule.existsSync(fullProjectPath);
  }

  private async removeProject(
    projectName: string,
    projectPath: string,
  ): Promise<void> {
    const fullProjectPath = this.pathModule.join(
      this.homeDir,
      projectPath,
      projectName,
    );
    if (this.fsModule.existsSync(fullProjectPath)) {
      this.fsModule.rmSync(fullProjectPath, { recursive: true, force: true });
    }
  }

  private async initProject(
    projectName: string,
    projectPath: string,
  ): Promise<void> {
    const fullProjectPath = this.pathModule.join(
      this.homeDir,
      projectPath,
      projectName,
    );
    this.createDirectories(fullProjectPath);
    this.createFiles(fullProjectPath, projectName);
    this.executeScripts(fullProjectPath);
  }

  private async createDirectories(root: string): Promise<void> {
    if (!this.fsModule.existsSync(root)) {
      this.fsModule.mkdirSync(root, { recursive: true });
    }

    new Set(FILES.map((item) => item.relativePath || ".")).forEach(
      (relativePath) => {
        const dirPath = this.pathModule.join(root, relativePath);
        if (!this.fsModule.existsSync(dirPath)) {
          this.fsModule.mkdirSync(dirPath, { recursive: true });
        }
      },
    );
  }

  private async createFiles(root: string, projectName: string): Promise<void> {
    for (const item of FILES) {
      const filePath = this.pathModule.join(
        root,
        item.relativePath || ".",
        item.filename,
      );
      if (!this.fsModule.existsSync(filePath)) {
        const content = await this.getFileContent(item);
        this.fsModule.writeFileSync(
          filePath,
          content.replaceAll(PROJECT_NAME, projectName),
          "utf-8",
        );
      }
    }
  }

  private async getFileContent(item: (typeof FILES)[number]): Promise<string> {
    if (item.content) {
      return item.content.trim() + "\n";
    }

    return this.fsModule.readFileSync(
      this.pathModule.join(
        this.getProjectRoot(),
        item.relativePath || ".",
        item.filename,
      ),
      "utf-8",
    );
  }

  private getProjectRoot(): string {
    if (!this.projectRoot) {
      let dir = this.pathModule.dirname(this.getImportMetaPath());
      while (
        !this.fsModule.existsSync(this.pathModule.join(dir, "package.json")) &&
        dir !== "/"
      ) {
        dir = this.pathModule.dirname(dir);
      }
      if (dir === "/") {
        throw new Error("Project root not found.");
      }
      this.projectRoot = dir;
    }

    return this.projectRoot;
  }

  private getImportMetaPath(): string {
    return import.meta.path;
  }

  private executeScripts(root: string): void {
    SCRIPTS.forEach((script) => {
      this.executeCommand(
        script.command,
        this.pathModule.join("/", script.workingDirectory || root),
      );
    });
  }

  private executeCommand(command: string, cwd?: string): void {
    try {
      this.cpModule.execSync(command, { cwd });
    } catch (err) {
      throw new Error(`Failed to execute command: ${command}`, { cause: err });
    }
  }
}
