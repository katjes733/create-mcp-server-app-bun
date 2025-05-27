import { execSync } from "child_process";
import pathModule from "path";
import os from "os";
import { writeFile } from "fs/promises";
import * as fs from "fs";
import {
  INDEX_TEXT,
  PACKAGE_JSON,
  TSCONFIG,
  PROJECT_NAME,
} from "./constants.js";

const homeDir = os.homedir();

export async function initProject(
  projectName: string,
  projectPath: string,
): Promise<void> {
  const root = pathModule.join(homeDir, projectPath, projectName);
  const source = pathModule.join(root, "src");

  if (!fs.existsSync(source)) {
    fs.mkdirSync(source, { recursive: true });
  }

  await writeContent(
    INDEX_TEXT.replaceAll(PROJECT_NAME, projectName),
    pathModule.join(source, "main.ts"),
  );
  await writeContent(
    PACKAGE_JSON.replaceAll(PROJECT_NAME, projectName),
    pathModule.join(root, "package.json"),
  );
  await writeContent(
    TSCONFIG.replaceAll(PROJECT_NAME, projectName),
    pathModule.join(root, "tsconfig.json"),
  );

  executeCommand("bun install", root);

  executeCommand("bun run build", root);
}

export async function replaceProject(
  projectName: string,
  projectPath: string,
): Promise<void> {
  const root = pathModule.join(homeDir, projectPath, projectName);
  if (fs.existsSync(root)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
  await initProject(projectName, projectPath);
}

async function writeContent(
  content: string,
  destination: string,
): Promise<void> {
  try {
    await writeFile(destination, content, "utf8");
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(err.message);
    }
  }
}

export async function projectExists(
  projectName: string,
  projectPath: string,
): Promise<boolean> {
  try {
    const root = pathModule.join(homeDir, projectPath, projectName);
    await fs.promises.access(root);
    return true;
  } catch {
    return false;
  }
}

function executeCommand(command: string, cwd: string | undefined): void {
  try {
    execSync(command, { cwd: cwd });
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(err.message);
    }
  }
}
