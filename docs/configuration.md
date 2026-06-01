# Configuration

Clone To Green looks for config files in this order:

1. `clone-to-green.yml`
2. `clone-to-green.yaml`
3. `.clone-to-green.yml`
4. `.clone-to-green.yaml`

Use `--config <file>` to choose a specific file.

## Example

```yaml
version: 1
profile: node
workdir: apps/web
env:
  NODE_ENV: test
commands:
  install: npm ci
  build: npm run build
  test: npm test
skip:
  install: false
  build: false
  test: false
```

Config command values may be strings or arrays of arguments:

```yaml
commands:
  test:
    - npm
    - test
```

Single-item arrays with spaces are treated as command strings:

```yaml
commands:
  test:
    - npm test
```

Use `required` to declare which steps must exist and pass:

```yaml
required:
  install: true
  build: false
  test: true
```

`ctg init` keeps the generated config short and commented:

```yaml
version: 1

# Run commands from this directory after Clone To Green creates a fresh workspace.
workdir: .

profile: node

commands:
  install:
    - npm ci
  build:
    - npm run build --if-present
  test:
    - npm test

required:
  install: true
  build: false
  test: true
```

CLI flags override config values when both are provided.
