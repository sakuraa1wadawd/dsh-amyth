// Embeds the skin's raster assets as base64 data URIs from lib/client.template.js
// into lib/client.js.
// Run after regenerating assets (scripts/prepare-assets.cjs) or editing the template:
//   node scripts/embed-assets.cjs
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const templatePath = path.join(root, 'lib', 'client.template.js');
const clientPath = path.join(root, 'lib', 'client.js');
const bgPath = path.join(root, 'assets', 'background.jpg');
const sidebarPath = path.join(root, 'assets', 'sidebar.jpg');
const characterPath = path.join(root, 'assets', 'character.webp');

const background = fs.readFileSync(bgPath);
const sidebar = fs.readFileSync(sidebarPath);
const character = fs.readFileSync(characterPath);

const bgData = 'data:image/jpeg;base64,' + background.toString('base64');
const sidebarData = 'data:image/jpeg;base64,' + sidebar.toString('base64');
const characterData = 'data:image/webp;base64,' + character.toString('base64');

let client = fs.readFileSync(templatePath, 'utf8');
if (!client.includes('__AMYTH_BACKGROUND__') || !client.includes('__AMYTH_SIDEBAR__') || !client.includes('__AMYTH_CHARACTER__')) {
  console.error('Placeholders not found in lib/client.template.js.');
  process.exit(1);
}
client = client.replace('__AMYTH_BACKGROUND__', bgData);
client = client.replace('__AMYTH_SIDEBAR__', sidebarData);
client = client.replace('__AMYTH_CHARACTER__', characterData);
fs.writeFileSync(clientPath, client);

console.log('embedded background: ' + background.length + ' bytes');
console.log('embedded sidebar:    ' + sidebar.length + ' bytes');
console.log('embedded character:  ' + character.length + ' bytes');
console.log('wrote: ' + clientPath);
