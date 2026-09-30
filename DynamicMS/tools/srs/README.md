# SRS revisions

Scripts that produce the DynamicCortex Apps Standard SRS revisions from the previous revision (Word).

- `revise.py <v1.4.docx> <v1.5.docx>` with `content15.py`: revision 1.5.
- `revise16.py <v1.5.docx> <v1.6.docx>` with `content16.py`: revision 1.6 (uses `revise_helpers.py`).
- Convert to PDF with LibreOffice, then `fixtoc.py <docx> <pdf> <out.docx>` sets the page numbers of the table of contents; convert again.
