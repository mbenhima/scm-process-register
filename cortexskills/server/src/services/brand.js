// Brand of generated documents and exports: AI Value Graphical Chart 1.2 as restated in SRS v1.10 Appendix J
// (NFR-DA-VDS-19, -20). One place for the colours, the embedded fonts and the logo files every exporter uses.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../config.js';

/** Palette (hex without '#'). Navy for headings and table headers, Ink for body text, Background for alternate rows. */
export const C = { navy: '123A5F', navyDark: '0D2A47', azure: '1876C6', green: '28C87C', teal: '17A2B8', ink: '2C3E50', muted: '5A6B7B',
  bg: 'F5F8FB', line: 'E1E8F0', azureTint: 'E8F1FB', greenTint: 'E7F9F0', tealTint: 'E6F6F8', white: 'FFFFFF' };
/** Status scale, the only colours allowed for conditional formatting (NFR-DA-VDS-20). */
export const STATUS = ['F4C7C3', 'FBE0B5', 'FFF3B0', 'D9EAD3', 'B6D7A8'];
export const RAG = { Green: 'D9EAD3', Vert: 'D9EAD3', Amber: 'FBE0B5', Ambre: 'FBE0B5', Red: 'F4C7C3', Rouge: 'F4C7C3' };
/** Chart series colours (FR-DA-VIZ-02). */
export const SERIES = ['1876C6', '28C87C', '17A2B8', '123A5F', '5A6B7B'];

export const FONT = n => path.join(ROOT, 'assets', 'fonts', n);
const FILES = { 'Open Sans': ['OpenSans-400.ttf', 'OpenSans-700.ttf', 'OpenSans-400i.ttf'], Montserrat: ['Montserrat-700.ttf', 'Montserrat-700.ttf', 'Montserrat-700.ttf'],
  serif: ['LiberationSerif-Regular.ttf', 'LiberationSerif-Bold.ttf', 'LiberationSerif-Italic.ttf'] };
const SERIF = ['Times New Roman', 'Cambria', 'Georgia', 'Garamond'];
/** TTF files (regular, bold, italic) used to embed a chosen font family in PDF exports. */
export function fontFiles(name) { const f = FILES[name] || (SERIF.includes(name) ? FILES.serif : FILES['Open Sans']); return f.map(FONT); }

const cache = {};
const read = f => (cache[f] ||= fs.readFileSync(path.join(ROOT, 'assets', 'brand', f)));
/** Logos: the product lockup for document headers, the company lockup for the cover (never recoloured or stretched). */
// 420 px wide files: 35 mm at 300 dpi, the print size used in documents.
export const LOGO = { product: () => read('cortexskills-lockup-doc.png'), productIcon: () => read('cortexskills-icon.png'), company: () => read('aivalue-lockup-doc.png') };
/** Fonts embedded in Word files (regular face; Word derives bold and italic). */
export const DOCX_FONTS = () => [{ name: 'Open Sans', data: fs.readFileSync(FONT('OpenSans-400.ttf')) }, { name: 'Montserrat', data: fs.readFileSync(FONT('Montserrat-700.ttf')) }];
