'use strict';

const fs = require('fs');
const path = require('path');
const m = require('./gen-doc');
const part2 = require('./gen-doc-part2');
const part3 = require('./gen-doc-part3');
const part4 = require('./gen-doc-part4');

const {
  Document, Packer, Paragraph, TextRun, Header, Footer,
  AlignmentType, LevelFormat, BorderStyle, PageNumber,
  HeadingLevel,
} = require('docx');

const {
  titlePage, tocSection, intro, ch1_taskStatement, ch2_tz,
  FONT, TS, TS_SM, TS_H1, TS_H2, TS_H3, MARGIN,
} = m;

const { ch3_ep, ch4_tp } = part2;
const { ch5_layouts, ch6_guide, ch7_sources } = part3;
const { ch8_listing } = part4;

console.log('[gen-doc] собираю документ...');

const doc = new Document({
  creator: 'Мифтахов Р. Н.',
  title: 'Пояснительная записка к курсовой работе — Расписание телепередач',
  description: 'Курсовая работа по дисциплине «Технологии веб-программирования»',

  styles: {
    default: {
      document: { run: { font: FONT, size: TS } },
    },
    paragraphStyles: [
      {
        id: 'Heading1',
        name: 'Heading 1',
        basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: TS_H1, bold: true, font: FONT, allCaps: true },
        paragraph: { spacing: { before: 240, after: 240, line: 360 }, outlineLevel: 0 },
      },
      {
        id: 'Heading2',
        name: 'Heading 2',
        basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: TS_H2, bold: true, font: FONT },
        paragraph: { spacing: { before: 240, after: 160, line: 360 }, outlineLevel: 1 },
      },
      {
        id: 'Heading3',
        name: 'Heading 3',
        basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: TS_H3, bold: true, font: FONT },
        paragraph: { spacing: { before: 200, after: 120, line: 360 }, outlineLevel: 2 },
      },
    ],
  },

  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '•',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
      {
        reference: 'numbers',
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: '%1.',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
    ],
  },

  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: MARGIN,
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({ children: [new TextRun('')] })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: '— ', font: FONT, size: 20 }),
              new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 20 }),
              new TextRun({ text: ' —', font: FONT, size: 20 }),
            ],
          })],
        }),
      },
      children: [
        ...titlePage,
        ...tocSection,
        ...intro,
        ...ch1_taskStatement,
        ...ch2_tz,
        ...ch3_ep,
        ...ch4_tp,
        ...ch5_layouts,
        ...ch6_guide,
        ...ch7_sources,
        ...ch8_listing,
      ],
    },
  ],
});

const outPath = path.resolve(__dirname, '..', 'Курсовая_Расписание_телепередач_Мифтахов_4311.docx');

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(outPath, buf);
  const stat = fs.statSync(outPath);
  console.log(`[gen-doc] OK — ${outPath}  (${(stat.size / 1024).toFixed(1)} КБ)`);
}).catch((err) => {
  console.error('[gen-doc] ОШИБКА:', err);
  process.exit(1);
});
