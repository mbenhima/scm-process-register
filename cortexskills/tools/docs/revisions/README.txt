Revisions of the POWERACT reference documents, made in place on the delivered Word files (formatting kept):
  update_pd.py  Process Design and End-to-End Processes 5.0 -> 6.0 (CortexSkills 1.15.0)
  update_pk.py  Packs, Integrations & Add-Ons 2.0 -> 3.0 (CortexSkills 1.15.0)
Usage: unzip the source .docx to <dir>; python3 update_xx.py <dir>/word/document.xml;
update the version in <dir>/word/header1.xml; python3 tocfix.py <dir> <out.docx> (zips, renders the PDF, sets TOC pages).
