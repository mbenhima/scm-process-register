const React = require('react');
const ReactDOMServer = require('react-dom/server');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const fa6 = require('react-icons/fa6');

const OUT = path.join(__dirname, 'assets');
fs.mkdirSync(OUT, { recursive: true });
const WHITE = 'FFFFFF';

// Every icon in the deck sits on top of a solid-colored circle (the icon-in-circle
// motif), so every icon is rendered white, unconditionally, for consistent contrast.
const icons = [
  ['compass', fa6.FaCompass], ['triangle-exclamation', fa6.FaTriangleExclamation],
  ['layer-group', fa6.FaLayerGroup], ['shuffle', fa6.FaShuffle], ['ghost', fa6.FaGhost],
  ['clock-rotate-left', fa6.FaClockRotateLeft], ['database', fa6.FaDatabase], ['sitemap', fa6.FaSitemap],
  ['shield-halved', fa6.FaShieldHalved], ['building', fa6.FaBuilding], ['globe', fa6.FaGlobe],
  ['user-tie', fa6.FaUserTie], ['users-gear', fa6.FaUsersGear], ['chart-line', fa6.FaChartLine],
  ['gear', fa6.FaGear], ['comments', fa6.FaComments], ['heart', fa6.FaHeart], ['check', fa6.FaCheck],
  ['xmark', fa6.FaXmark], ['route', fa6.FaRoute], ['eye', fa6.FaEye], ['pen-to-square', fa6.FaPenToSquare],
  ['ban', fa6.FaBan], ['file-signature', fa6.FaFileSignature], ['server', fa6.FaServer], ['rocket', fa6.FaRocket],
  ['robot', fa6.FaRobot], ['certificate', fa6.FaCertificate], ['diagram-project', fa6.FaDiagramProject],
  ['building-columns', fa6.FaBuildingColumns], ['people-group', fa6.FaPeopleGroup], ['scale-balanced', fa6.FaScaleBalanced],
  ['graduation-cap', fa6.FaGraduationCap], ['industry', fa6.FaIndustry], ['truck', fa6.FaTruck],
  ['heart-pulse', fa6.FaHeartPulse], ['bolt', fa6.FaBolt], ['gavel', fa6.FaGavel], ['arrow-trend-up', fa6.FaArrowTrendUp],
  ['seedling', fa6.FaSeedling], ['calendar-check', fa6.FaCalendarCheck], ['paper-plane', fa6.FaPaperPlane],
  ['user', fa6.FaUser], ['cubes', fa6.FaCubes],
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
