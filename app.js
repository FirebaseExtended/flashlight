#!/usr/bin/env node

/*
 * @version 0.3, 3 June 2014
 */

var flashlight = require('./module.js');

try {
  flashlight.launchService(
    flashlight.configure()
  );
}
catch (err) {
  console.log(optometrist.usage('app.js', 'Run Flashlight Firebase/ES sync daemon.', flashlight.confSchema));
  process.exit(1);
}
