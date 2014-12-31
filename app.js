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
  console.log(flashlight.usage());
  process.exit(1);
}
