import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

export interface ISandboxResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

export const executePythonCode = async (
  code: string,
  sessionId: string
): Promise<ISandboxResult> => {
  // Ensure the temp directory exists inside workspace
  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const scriptPath = path.join(tempDir, `sandbox_${sessionId}_${Date.now()}.py`);
  
  // Write the code to file
  fs.writeFileSync(scriptPath, code, 'utf-8');

  return new Promise<ISandboxResult>((resolve) => {
    // Execute python command. We attempt 'python' first, then fallback to 'python3' if needed.
    // We run the script with a timeout of 10 seconds to prevent infinite loops.
    exec(`python "${scriptPath}"`, { timeout: 10000 }, (error, stdout, stderr) => {
      // Clean up script file
      try {
        if (fs.existsSync(scriptPath)) {
          fs.unlinkSync(scriptPath);
        }
      } catch (err) {
        console.error('[Sandbox] Failed to delete temp file:', err);
      }

      if (error) {
        // Fallback to python3 command if error looks like python is not found (windows vs unix)
        const isPythonNotFound = error.message.includes('not found') || error.message.includes('is not recognized');
        if (isPythonNotFound) {
          exec(`python3 "${scriptPath}"`, { timeout: 10000 }, (error3, stdout3, stderr3) => {
            resolve({
              success: !error3,
              stdout: stdout3,
              stderr: stderr3 || (error3 ? error3.message : ''),
              exitCode: error3 ? (error3.code || 1) : 0
            });
          });
          return;
        }

        resolve({
          success: false,
          stdout,
          stderr: stderr || error.message,
          exitCode: error.code || 1
        });
        return;
      }

      resolve({
        success: true,
        stdout,
        stderr,
        exitCode: 0
      });
    });
  });
};
