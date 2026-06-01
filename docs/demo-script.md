# 60 Second Demo Script

## Setup

Open a terminal at the Clone To Green repository root.

## Script

1. Run the default demo:

   ```sh
   clone-to-green demo
   ```

   Explain that the default demo shows what a fragile repo looks like when a stranger tries to get to green.

2. Show a passing repo:

   ```sh
   ctg demo --green
   ```

3. Show a red repo:

   ```sh
   ctg demo --red
   ```

4. Run a bundled green example:

   ```sh
   ctg run examples/node-green
   ```

5. Run a missing-tests example:

   ```sh
   ctg run examples/node-missing-tests
   ```

6. Show the yellow escape hatch:

   ```sh
   ctg run examples/node-missing-tests --allow-no-tests
   ```

7. Open an HTML report:

   ```sh
   ctg demo --format html --output ctg-demo.html
   open ctg-demo.html
   ```

## Close

Clean clone reproducibility matters for OSS maintainers, starter templates, hiring repos, and internal platform teams because it catches hidden setup assumptions before users trip over them.
