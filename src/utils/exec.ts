import { execa } from 'execa';

export async function commandVersion(command: string, args = ['--version']): Promise<{
  available: boolean;
  version?: string;
  error?: string;
}> {
  try {
    const result = await execa(command, args, {
      reject: false,
      timeout: 3000,
      env: { ...process.env }
    });
    const output = `${result.stdout}${result.stderr ? `\n${result.stderr}` : ''}`.trim();
    if (result.exitCode === 0) {
      return { available: true, version: output.split('\n')[0] };
    }
    if (result.exitCode === undefined) {
      return { available: false, error: 'not found' };
    }
    return { available: false, error: output || `Exited with code ${result.exitCode}` };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { available: false, error: message.includes('ENOENT') ? 'not found' : message };
  }
}
