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
  ['bell', fa6.FaBell], ['gauge', fa6.FaGauge], ['flag', fa6.FaFlag],
  ['clipboard-check', fa6.FaClipboardCheck], ['users', fa6.FaUsers], ['circle-check', fa6.FaCircleCheck],
  ['wrench', fa6.FaWrench], ['network-wired', fa6.FaNetworkWired], ['user-shield', fa6.FaUserShield],
  ['hourglass-half', fa6.FaHourglassHalf], ['leaf', fa6.FaLeaf], ['clipboard-list', fa6.FaClipboardList],
  ['chalkboard-user', fa6.FaChalkboardUser], ['circle-play', fa6.FaCirclePlay],
  ['screwdriver-wrench', fa6.FaScrewdriverWrench], ['money-bill-wave', fa6.FaMoneyBillWave],
  ['file-invoice-dollar', fa6.FaFileInvoiceDollar], ['circle-question', fa6.FaCircleQuestion],
  ['handshake', fa6.FaHandshake], ['route', fa6.FaRoute],
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
