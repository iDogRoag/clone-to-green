export const STEP_NAMES = ['install', 'build', 'test'] as const;
export const PROFILES = ['auto', 'node', 'python', 'go', 'rust', 'docker', 'custom'] as const;
export const DETECTED_PROFILES = ['node', 'python', 'go', 'rust', 'docker', 'custom', 'unknown'] as const;
export const OUTPUT_FORMATS = ['table', 'json', 'markdown', 'html'] as const;

export type StepName = (typeof STEP_NAMES)[number];
export type Profile = (typeof PROFILES)[number];
export type DetectedProfile = (typeof DETECTED_PROFILES)[number];
export type OutputFormat = (typeof OUTPUT_FORMATS)[number];

export type FailureCategory =
  | 'clone_failed'
  | 'install_failed'
  | 'build_failed'
  | 'test_failed'
  | 'config_invalid'
  | 'missing_tool'
  | 'timeout'
  | 'no_test_detected'
  | 'internal_error';

export type StepStatus = 'passed' | 'failed' | 'skipped' | 'timeout';
export type ReportStatus = 'green' | 'yellow' | 'red';
export type SourceKind = 'local' | 'git' | 'github';
export type ReproducibilityConfidence = 'strong' | 'good' | 'fragile' | 'weak';

export type CommandMap = Partial<Record<StepName, string[]>>;
export type SkipMap = Partial<Record<StepName, boolean>>;
export type RequiredMap = Partial<Record<StepName, boolean>>;

export interface CloneToGreenConfig {
  version?: 1;
  profile?: Profile;
  workdir?: string;
  commands?: CommandMap;
  env?: Record<string, string>;
  skip?: SkipMap;
  required?: RequiredMap;
}

export interface ProjectDetection {
  profile: DetectedProfile;
  packageManager?: string;
  reasons: string[];
  commands: CommandMap;
}

export interface PlanStep {
  name: StepName;
  command: string[];
  skipped: boolean;
  required: boolean;
  reason?: string;
}

export interface ExecutionPlan {
  detection: ProjectDetection;
  workdir: string;
  steps: PlanStep[];
}

export interface StepResult {
  name: StepName;
  command: string[];
  status: StepStatus;
  exitCode?: number;
  durationMs: number;
  logPath?: string;
}

export interface ExecutionResult {
  status: ReportStatus;
  category?: FailureCategory;
  summary: string;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  steps: StepResult[];
}

export interface SourceInfo {
  input: string;
  kind: SourceKind;
  resolved: string;
}

export interface WorkspaceInfo {
  path: string;
  kept: boolean;
  workdir: string;
}

export interface CloneToGreenReport {
  tool: 'clone-to-green';
  version: string;
  source: SourceInfo;
  workspace: WorkspaceInfo;
  detection: {
    profile: DetectedProfile;
    packageManager?: string;
    reasons: string[];
  };
  plan: {
    steps: PlanStep[];
  };
  reproducibility: ReproducibilityScore;
  result: {
    status: ReportStatus;
    category?: FailureCategory;
    summary: string;
    startedAt: string;
    endedAt: string;
    durationMs: number;
  };
  steps: StepResult[];
}

export interface ReproducibilityFinding {
  id: string;
  label: string;
  points: number;
  message: string;
}

export interface ReproducibilityScore {
  score: number;
  confidence: ReproducibilityConfidence;
  signals: ReproducibilityFinding[];
  penalties: ReproducibilityFinding[];
}

export interface DetectOptions {
  profile: Profile;
}

export interface CreatePlanOptions {
  profile: Profile;
  workdir?: string;
  config?: CloneToGreenConfig;
  skipInstall?: boolean;
  skipBuild?: boolean;
  skipTest?: boolean;
}

export interface ExecutePlanOptions {
  stepTimeoutSeconds: number;
  timeoutSeconds?: number;
  artifactsDir?: string;
  env: Record<string, string>;
  inheritEnv: boolean;
  verbose: boolean;
  quiet?: boolean;
  allowNoTests: boolean;
}

export interface PreparedWorkspace {
  source: SourceInfo;
  workspacePath: string;
  tempRoot: string;
  cleanup: () => Promise<void>;
}

export interface DoctorToolResult {
  name: string;
  available: boolean;
  version?: string;
  error?: string;
}

export interface CliIo {
  stdout?: (chunk: string) => void;
  stderr?: (chunk: string) => void;
}

export const VERSION = '0.1.2';
