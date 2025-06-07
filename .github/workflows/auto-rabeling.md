name: Claude Auto Rabeling

on:
  workflow_dispatch:

jobs:
  lint:
    runs-on: self-hosted
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - name: claude code command
        run: claude --dangerously-skip-permissions -p "/yomimono-rabeling"
