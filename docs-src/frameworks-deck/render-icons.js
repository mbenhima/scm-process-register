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
  ['snowflake', fa6.FaSnowflake], ['anchor', fa6.FaAnchor], ['lightbulb', fa6.FaLightbulb],
  ['book-open', fa6.FaBookOpen], ['hand-fist', fa6.FaHandFist], ['door-closed', fa6.FaDoorClosed],
  ['cloud', fa6.FaCloud], ['sun', fa6.FaSun], ['face-frown', fa6.FaFaceFrown],
  ['magnifying-glass', fa6.FaMagnifyingGlass], ['handshake', fa6.FaHandshake], ['gauge', fa6.FaGauge],
  ['bell', fa6.FaBell], ['circle-question', fa6.FaCircleQuestion], ['list-check', fa6.FaListCheck],
  ['flag', fa6.FaFlag], ['clipboard-check', fa6.FaClipboardCheck], ['map', fa6.FaMap],
  ['users', fa6.FaUsers], ['circle-check', fa6.FaCircleCheck],
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
