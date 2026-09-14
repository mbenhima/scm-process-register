const React = require('react');
const ReactDOMServer = require('react-dom/server');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const fa6 = require('react-icons/fa6');

const OUT = path.join(__dirname, 'assets');
fs.mkdirSync(OUT, { recursive: true });
const WHITE = 'FFFFFF';

const icons = [
  ['book-open', fa6.FaBookOpen], ['chalkboard-user', fa6.FaChalkboardUser],
  ['circle-question', fa6.FaCircleQuestion], ['flag-checkered', fa6.FaFlagCheckered],
  ['medal', fa6.FaMedal], ['list-check', fa6.FaListCheck], ['user-graduate', fa6.FaUserGraduate],
  ['clipboard-check', fa6.FaClipboardCheck], ['award', fa6.FaAward], ['clock', fa6.FaClock],
  ['users', fa6.FaUsers],
];

async function run() {
  for (const [name, Comp] of icons) {
    const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { size: 256, color: `#${WHITE}` }));
    const fullSvg = svg.includes('xmlns=') ? svg : svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
    await sharp(Buffer.from(fullSvg)).resize(256, 256).png().toFile(path.join(OUT, `${name}.png`));
    console.log('wrote', name);
  }
}
run().catch(e => { console.error(e); process.exit(1); });
