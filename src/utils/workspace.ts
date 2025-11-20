import * as fs from 'fs';
import * as path from 'path';

/**
 * Get or create the workspace directory for the update process
 * @param customPath Optional custom workspace path
 * @returns The absolute path to the workspace directory
 */
export function getWorkspaceDir(customPath?: string): string {
  if (customPath) {
    // If a custom path is provided, use it as-is
    const absPath = path.isAbsolute(customPath)
      ? customPath
      : path.resolve(process.cwd(), customPath);

    // Create the directory if it doesn't exist
    if (!fs.existsSync(absPath)) {
      fs.mkdirSync(absPath, { recursive: true });
    }

    return absPath;
  }

  // Auto-generate workspace directory based on current date
  const today = new Date();
  const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format

  const workspaceDir = path.resolve(process.cwd(), 'updates', dateString);

  // Create the directory if it doesn't exist
  if (!fs.existsSync(workspaceDir)) {
    fs.mkdirSync(workspaceDir, { recursive: true });
    console.log(`Created workspace directory: ${workspaceDir}`);
  } else {
    console.log(`Using existing workspace directory: ${workspaceDir}`);
  }

  return workspaceDir;
}

/**
 * Format the current date in YYYY-MM-DD format
 */
export function getCurrentDateString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}
