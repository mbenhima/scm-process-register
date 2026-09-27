const path = require('path');
const { buildDeck } = require('./template.js');
const { fixPptx } = require('./fix-pptx.js');

const TYPES = ['erp', 'bpr', 'automation', 'qms', 'cultural', 'operating-model', 'compliance', 'training-skills'];

const FILE_NAMES = {
  erp: 'journi_ERP_Deep_Dive',
  bpr: 'journi_BPR_Deep_Dive',
  automation: 'journi_Automation_Deep_Dive',
  qms: 'journi_QMS_Deep_Dive',
  cultural: 'journi_Cultural_Deep_Dive',
  'operating-model': 'journi_Operating_Model_Deep_Dive',
  compliance: 'journi_Compliance_Deep_Dive',
  'training-skills': 'journi_Training_Skills_Deep_Dive',
};

async function main() {
  const only = process.argv[2];
  const list = only ? [only] : TYPES;
  for (const id of list) {
    const data = require(`./data/${id}.js`);
    const pptx = buildDeck(data);
    const fileName = path.join(__dirname, `${FILE_NAMES[id]}.pptx`);
    await pptx.writeFile({ fileName });
    console.log(`wrote ${fileName}, slide count: ${pptx.slides.length}`);
    await fixPptx(fileName);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
