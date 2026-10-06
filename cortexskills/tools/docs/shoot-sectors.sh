#!/bin/bash
# Captures, for every sector (large organization, AI run), the workspace and an open task with its typed steps,
# in English and French; then the walkthrough screens of the deck in both languages.
cd "$(dirname "$0")/../qa"; export PW=$(npm root -g)/playwright DPR=1.25
OUT=../docs/shots
python3 -c "import json;[print(r['orgs']['LARGE']['domain'], r['code']) for r in json.load(open('../docs/sector-data.json'))]" | while read dom code; do
  for lang in en fr; do mkdir -p $OUT/sectors_$lang; node shoot.mjs http://localhost:4000 headld@$dom 'CortexSkills#2026' $lang $OUT/sectors_$lang $code=/projects/:project:ai "${code}_task=/runs/:run?task=:task" >/dev/null 2>&1 || echo "fail $code $lang"; done
done
for lang in en fr; do mkdir -p $OUT/$lang
  DPR=1.5 node shoot.mjs http://localhost:4000 headld@atlasmotorskenitra.ma 'CortexSkills#2026' $lang $OUT/$lang dashboard=/ tenancy=/tenancy newproject=/projects/new ws=/projects/:project:ai run=/runs/:run task='/runs/:run?task=:task' steptask='/runs/:run?task=:task' gantt=/projects/:project:ai/gantt portfolio=/portfolio reports=/reports assistant=/assistant e2e=/process/e2e chain=/process/chain racsi=/gov/racsi bpmn=/process/bpmn design='/process/design?kind=step&id=MP-01.1' obs=/gov/obs >/dev/null
  DPR=1.5 node shoot.mjs http://localhost:4000 headld@cliniquealamal.ma 'CortexSkills#2026' $lang $OUT/$lang sme_ws=/projects/:project:digital sme_task='/runs/:run?task=:task' sme_ws2=/projects/:project:digital sme_task2='/runs/:run?task=:task' >/dev/null
done
W=390 H=844 DPR=2 node shoot.mjs http://localhost:4000 headld@cliniquealamal.ma 'CortexSkills#2026' ar $OUT/en m_ar=/projects/:project:digital >/dev/null
echo DONE
