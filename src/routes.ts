import { Router, Request, Response } from 'express';
import fs from 'fs';

import PDFPrinter from 'pdfmake';
import { TDocumentDefinitions } from 'pdfmake/interfaces';

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
        table: {
          body: [['ID', 'Descrição', 'Preço', 'Quantidade'], ...body],
        },
      },
    ],
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
