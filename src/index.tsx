#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { App } from './app.js';
import { createCLI } from './cli.js';

// Parse CLI arguments
const options = createCLI();

// Render the app
render(<App options={options} />);
