import type { CloneToGreenReport } from '../types.js';

export function renderJsonReport(report: CloneToGreenReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}
