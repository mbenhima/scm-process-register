// Office Open XML packages that open without a repair prompt (FR-DA-DOC-12): the archive written by the document and
// workbook libraries is rewritten without directory entries, [Content_Types].xml first, every member deflated.
import JSZip from 'jszip';
export async function cleanOffice(buf) {
  const src = await JSZip.loadAsync(buf); const out = new JSZip();
  const names = Object.keys(src.files).filter(n => !src.files[n].dir).sort((a, b) => (a === '[Content_Types].xml' ? -1 : b === '[Content_Types].xml' ? 1 : 0));
  for (const n of names) out.file(n, await src.files[n].async('nodebuffer'), { createFolders: false, date: src.files[n].date });
  return out.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 }, mimeType: 'application/zip' });
}
