import { Router, Request, Response } from 'express';
import fs from 'fs';

import PDFPrinter from 'pdfmake';
import { TableCell, TDocumentDefinitions } from 'pdfmake/interfaces';

import { prismaClient } from './database/prismaClient';

const routes = Router();

routes.get('/products', async (request: Request, response: Response) => {
  const products = await prismaClient.products.findMany();

  return response.json(products);
});

routes.get('/products/report', async (request: Request, response: Response) => {
  const products = await prismaClient.products.findMany();

  const fonts = {
    Helvetica: {
      normal: 'Helvetica',
      bold: 'Helvetica-Bold',
      italics: 'Helvetica-Oblique',
      bolditalics: 'Helvetica-BoldOblique',
    },
  };

  const printer = new PDFPrinter(fonts);

  const body = [];

  const columnsTitle: TableCell[] = [
    { text: 'ID', style: 'columnsTitle' },
    { text: 'Descrição', style: 'columnsTitle' },
    { text: 'Preço', style: 'columnsTitle' },
    { text: 'Quantidade', style: 'columnsTitle' },
  ];

  const columnsBody = new Array();

  columnsTitle.forEach(column => columnsBody.push(column));
  body.push(columnsBody);

  for await (let product of products) {
    const rows = new Array();
    rows.push(product.id);
    rows.push(product.description);
    rows.push(product.price);
    rows.push(product.quantity);

    body.push(rows);
  }

  const docDefefinitions: TDocumentDefinitions = {
    defaultStyle: { font: 'Helvetica' },
    content: [
      {
        columns: [
          {
            text: 'Relatório de Produtos',
            style: 'header',
          },
          { text: '23/10/2021 17:54\n\n', style: 'header' },
        ],
      },
      {
        table: {
          heights: function (row) {
            return 30;
          },
          widths: [250, 'auto', 50, 'auto'],
          body,
        },
      },
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        alignment: 'center',
      },
      columnsTitle: {
        fontSize: 15,
        bold: true,
        fillColor: '#7159c1',
        color: '#FFF',
        alignment: 'center',
        margin: 4,
      },
    },
  };

  const pdfDoc = printer.createPdfKitDocument(docDefefinitions);

  // pdfDoc.pipe(fs.createWriteStream('Relatorio.pdf'));

  const chunks: Array<Buffer> = [];

  pdfDoc.on('data', chunk => {
    chunks.push(chunk);
  });

  pdfDoc.end();

  pdfDoc.on('end', () => {
    const result = Buffer.concat(chunks);
    response.end(result);
  });
});

export { routes };
