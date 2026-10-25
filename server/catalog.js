'use strict';
/* The destinations / blogs / foods live in public/js/data.js (the frontend reads the same file).
   We evaluate it once in an isolated VM context so the API always agrees with the website. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadCatalog(publicDir) {
  const code = fs.readFileSync(path.join(publicDir, 'js', 'data.js'), 'utf8');
  const raw = vm.runInNewContext(`${code}\n;({ destinations, blogs, blogCategories, FOODS, SHOP })`, Object.create(null), { timeout: 2000 });
  const c = JSON.parse(JSON.stringify(raw)); // detach from the VM context
  c.destById = new Map(c.destinations.map((d) => [d.id, d]));
  c.postCategories = c.blogCategories.filter((x) => x !== 'All');
  return c;
}

module.exports = { loadCatalog };
