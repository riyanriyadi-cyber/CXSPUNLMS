'use strict';
/** Reads a required environment variable or throws a clear configuration error. */
function need(name, minLength) {
  const v = process.env[name];
  if (!v || v.length < (minLength || 1)) {
    const e = new Error('Server configuration error: ' + name + ' is missing or too short.');
    e.code = 'CONFIG';
    throw e;
  }
  return v;
}
module.exports = { need };
