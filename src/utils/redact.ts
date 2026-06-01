const SECRET_KEY_PATTERN = /(token|secret|password|passwd|pwd|api[_-]?key|auth|credential|npm_token|github_token)/i;

export function redactText(input: string): string {
  return input
    .replace(/(https?:\/\/)([^/\s:@]+):([^/\s@]+)@/gi, '$1[REDACTED]:[REDACTED]@')
    .replace(
      /([A-Za-z_][A-Za-z0-9_]*(?:TOKEN|SECRET|PASSWORD|PASSWD|PWD|API_KEY|AUTH|CREDENTIAL)[A-Za-z0-9_]*\s*=\s*)([^\s]+)/gi,
      '$1[REDACTED]'
    );
}

export function redactValue(key: string, value: string): string {
  return SECRET_KEY_PATTERN.test(key) ? '[REDACTED]' : redactText(value);
}

export function redactCommand(command: string[]): string[] {
  return command.map((part) => redactText(part));
}
