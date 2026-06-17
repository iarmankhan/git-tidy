#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { App } from './app.js';
import { createCLI } from './cli.js';
import { runHeadless } from './headless.js';

// Parse CLI arguments
const options = createCLI();

if (options.headless) {
  // Non-interactive mode for scripts and agents.
  runHeadless(options).then(
    (code) => process.exit(code),
    (err) => {
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  );
} else {
  // Interactive wizard.
  render(<App options={options} />);
}
