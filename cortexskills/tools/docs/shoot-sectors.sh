#!/bin/bash
# Captures one AI-run workspace per sector (large organization) in EN and FR, and the walkthrough screens in FR.
cd "$(dirname "$0")/../qa"; export PW=$(npm root -g)/playwright DPR=1.25
OUT=../docs/shots
for lang in en fr; do mkdir -p $OUT/sectors_$lang; done
python3 -c "import json;[print(r['orgs']['LARGE']['domain'], r['code']) for r in json.load(open('../docs/sector-data.json'))]" | while read dom code; do
  for lang in en fr; do node shoot.mjs http://localhost:4000 headld@$dom 'CortexSkills#2026' $lang $OUT/sectors_$lang $code=/projects/:project:ai >/dev/null 2>&1 || echo "fail $code $lang"; done
done
mkdir -p $OUT/fr
DPR=1.5 node shoot.mjs http://localhost:4000 headld@atlasmotorskenitra.ma 'CortexSkills#2026' fr $OUT/fr dashboard=/ tenancy=/tenancy newproject=/projects/new ws=/projects/:project:ai run=/runs/:run task='/runs/:run?task=:task' gantt=/projects/:project:ai/gantt portfolio=/portfolio reports=/reports assistant=/assistant e2e=/process/e2e chain=/process/chain racsi=/gov/racsi bpmn=/process/bpmn
DPR=1.5 node shoot.mjs http://localhost:4000 headld@atlasmotorskenitra.ma 'CortexSkills#2026' en $OUT/en chain=/process/chain bpmn=/process/bpmn
DPR=1.5 node shoot.mjs http://localhost:4000 headld@cliniquealamal.ma 'CortexSkills#2026' fr $OUT/fr sme_ws=/projects/:project:digital sme_task='/runs/:run?task=:task'
DPR=1.5 node shoot.mjs http://localhost:4000 headld@cliniquealamal.ma 'CortexSkills#2026' en $OUT/en sme_ws2=/projects/:project:digital sme_task2='/runs/:run?task=:task'
W=390 H=844 DPR=2 node shoot.mjs http://localhost:4000 headld@cliniquealamal.ma 'CortexSkills#2026' ar $OUT/en m_ar=/projects/:project:digital
echo DONE
