import os
import re

SRC = os.path.join(os.path.dirname(__file__), 'journi_spec.md')
OUT = 'spec-preprocessed.md'

with open(SRC, encoding='utf-8') as f:
    raw_lines = f.readlines()

# Pre-pass: join a "**...heading text" line that opens bold but doesn't
# close it on the same line (an odd number of "**" pairs) with the
# following line, which is where the closing "**" actually lands. This
# only happens for a handful of long numbered headings that wrapped when
# the original docx was converted to markdown.
lines = []
i = 0
while i < len(raw_lines):
    line = raw_lines[i]
    stripped = line.rstrip('\n')
    if stripped.startswith('**') and stripped.count('**') % 2 == 1 and i + 1 < len(raw_lines):
        nxt = raw_lines[i + 1].rstrip('\n')
        merged = stripped + ' ' + nxt.strip()
        lines.append(merged + '\n')
        i += 2
        continue
    lines.append(line)
    i += 1

H3_NUM = re.compile(r'^\*\*(\d+)\.(\d+)\.(\d+)\s+(.+?)\*\*\s*$')
H2_NUM = re.compile(r'^\*\*(\d+)\.(\d+)\s+(.+?)\*\*\s*$')
H1_NUM = re.compile(r'^\*\*(\d+)\.\s+(.+?)\*\*\s*$')
MODULE = re.compile(r'^\*\*(Module\s+\d+.+?)\*\*\s*$')
TOC_LINE = re.compile(r'^\*\*Table of Contents\*\*\s*$')

PAGEBREAK = '\n```{=openxml}\n<w:p><w:r><w:br w:type="page"/></w:r></w:p>\n```\n\n'

out_lines = []
headings_found = []

for line in lines:
    stripped = line.rstrip('\n')

    if TOC_LINE.match(stripped):
        out_lines.append(PAGEBREAK)
        out_lines.append('# Table of Contents\n\n')
        out_lines.append('TOCPLACEHOLDERXYZ\n\n')
        out_lines.append(PAGEBREAK)
        continue

    m3 = H3_NUM.match(stripped)
    if m3:
        text = f'{m3.group(1)}.{m3.group(2)}.{m3.group(3)} {m3.group(4)}'
        out_lines.append(f'### {text}\n')
        headings_found.append(('H3', text))
        continue

    m2 = H2_NUM.match(stripped)
    if m2:
        text = f'{m2.group(1)}.{m2.group(2)} {m2.group(3)}'
        out_lines.append(f'## {text}\n')
        headings_found.append(('H2', text))
        continue

    m1 = H1_NUM.match(stripped)
    if m1:
        text = f'{m1.group(1)}. {m1.group(2)}'
        out_lines.append(f'# {text}\n')
        headings_found.append(('H1', text))
        continue

    mm = MODULE.match(stripped)
    if mm:
        out_lines.append(f'### {mm.group(1)}\n')
        headings_found.append(('H3', mm.group(1)))
        continue

    out_lines.append(line)

with open(OUT, 'w', encoding='utf-8') as f:
    f.writelines(out_lines)

print('wrote', OUT, '-', len(headings_found), 'headings detected')
for lvl, txt in headings_found:
    print(f'  {lvl}: {txt}')
