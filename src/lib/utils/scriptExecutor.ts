import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface ScriptResult {
  stdout: string;
  stderr: string;
  success: boolean;
}

export async function executeScript(
  command: string,
  options: {
    cwd?: string;
    timeout?: number;
    maxBuffer?: number;
  } = {}
): Promise<ScriptResult> {
  try {
    const { stdout, stderr } = await execAsync(command, {
      ...options,
      maxBuffer: options.maxBuffer || 1024 * 1024, // 1MB default
      timeout: options.timeout || 30000, // 30 seconds default
    });

    return {
      stdout,
      stderr,
      success: true
    };
  } catch (error) {
    console.error(`Script execution failed: ${error}`);
    return {
      stdout: '',
      stderr: error instanceof Error ? error.message : 'Unknown error',
      success: false
    };
  }
}

// Example usage:
// await executeScript('shutdown /s /t 0', { timeout: 5000 });
