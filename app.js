#!/usr/bin/env node

/*
 * @version 0.3, 3 June 2014
 */

var flue = require('./module.js');

try {
  flue.launchService(
    flue.configure()
  );
}
catch (err) {
  console.log(flue.usage());
  process.exit(1);
}
