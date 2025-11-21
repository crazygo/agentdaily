import * as fs from 'fs';
import * as path from 'path';

interface TasksConfig {
  tasks: string[];
}

/**
 * Load tasks configuration from config/tasks.json
 */
export function loadTasksConfig(): TasksConfig {
  const configPath = path.resolve(process.cwd(), 'config', 'tasks.json');

  if (!fs.existsSync(configPath)) {
    throw new Error(`Tasks configuration file not found: ${configPath}`);
  }

  const configContent = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(configContent);
}

/**
 * Export the tasks configuration
 */
export const tasksConfig: TasksConfig = loadTasksConfig();