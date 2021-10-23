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

routes.get('/products/report', (request: Request, response: Response) => {
  const fonts = {
    Helvetica: {
      normal: 'Helvetica',
      bold: 'Helvetica-Bold',
      italics: 'Helvetica-Oblique',
      bolditalics: 'Helvetica-BoldOblique',
    },
  };

  const printer = new PDFPrinter(fonts);

  const docDefefinitions: TDocumentDefinitions = {
    defaultStyle: { font: 'Helvetica' },
    content: [
      {
        text: 'textando relatório.',
      },
    ],
  };

  const pdfDoc = printer.createPdfKitDocument(docDefefinitions);

  pdfDoc.pipe(fs.createWriteStream('Relatorio.pdf'));

  pdfDoc.end();

  response.send('Relatório concluído!');
});

export { routes };
