# Report Schema

JSON reports use this shape:

```ts
type CloneToGreenReport = {
  tool: 'clone-to-green';
  version: string;
  source: {
    input: string;
    kind: 'local' | 'git' | 'github';
    resolved: string;
  };
  workspace: {
    path: string;
    kept: boolean;
    workdir: string;
  };
  detection: {
    profile: 'node' | 'python' | 'go' | 'rust' | 'docker' | 'custom' | 'unknown';
    packageManager?: string;
    reasons: string[];
  };
  plan: {
    steps: Array<{
      name: 'install' | 'build' | 'test';
      command: string[];
      skipped: boolean;
      reason?: string;
    }>;
  };
  result: {
    status: 'green' | 'yellow' | 'red';
    category?: FailureCategory;
    summary: string;
    startedAt: string;
    endedAt: string;
    durationMs: number;
  };
  reproducibility: {
    score: number;
    confidence: 'strong' | 'good' | 'fragile' | 'weak';
    signals: ReproducibilityFinding[];
    penalties: ReproducibilityFinding[];
  };
  steps: Array<{
    name: 'install' | 'build' | 'test';
    command: string[];
    status: 'passed' | 'failed' | 'skipped' | 'timeout';
    exitCode?: number;
    durationMs: number;
    logPath?: string;
  }>;
};

type ReproducibilityFinding = {
  id: string;
  label: string;
  points: number;
  message: string;
};
```

Status and score are separate. The status says whether the repo reached the required state; the reproducibility score explains fragility.

Failure categories:

- `clone_failed`
- `install_failed`
- `build_failed`
- `test_failed`
- `config_invalid`
- `missing_tool`
- `timeout`
- `no_test_detected`
- `internal_error`
