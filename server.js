const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const app = express();

app.use(express.json({ limit: '10mb' })); // Aceita grandes quantidades de dados

// Função para converter imagem em base64
const imageToBase64 = (path) => `data:image/png;base64,${fs.readFileSync(path).toString('base64')}`;
const base64Image = imageToBase64('img/logo.png');

// Função para gerar HTML
const generateHTML = (fullTableHTML) => `
    <html>
    <head>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <style>
            @page { margin: 100px 30px 50px 30px; }
            body { font-family: Arial, sans-serif; }
        </style>
    </head>
    <body>
        ${fullTableHTML}
    </body>
    </html>
`;

// Função para gerar template de cabeçalho e rodapé
const generateHeaderFooter = (titlePDF, imgPDF) => ({
    headerTemplate: `
        <div style="width: 100%; position: relative; padding: 0 20px; box-sizing: border-box; height: 50px; display: flex; align-items: center;">
            <img alt="Logo Systextil" style="height: 30px; position: absolute; left: 20px;" src="${imgPDF}" />
            <div style="font-size: 30px; text-align: center; width: 100%; position: absolute; left: 0; right: 0; margin: auto;">
                <span>${titlePDF}</span>
            </div>
        </div>`,
    footerTemplate: `
        <div style="font-size:10px; width:100%; text-align:center; color: grey; display: flex; align-items: center; padding: 0 20px; box-sizing: border-box;"> 
            <div style="display: flex; align-items: center; margin-right: auto;">
                <img alt="Logo Systextil" style="height: 20px; margin-right: 5px;" src="${base64Image}"/>
                <span style="text-align: left;">Simplificando a cadeia têxtil!</span>
            </div>
            <div style="margin-left: auto;">
                <span style="white-space: nowrap;">Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
            </div>
        </div>`
});

// Função genérica para gerar PDF
const generatePDF = async (fullTableHTML, titlePDF, imgPDF, pageRanges = '') => {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(generateHTML(fullTableHTML), { waitUntil: 'networkidle0' });
    await page.waitForTimeout(2000);

    if (!titlePDF || titlePDF.trim() === '') titlePDF = 'Relatório';
    if (!imgPDF || imgPDF.trim() === '') imgPDF = base64Image;

    const pdfOptions = {
        printBackground: true,
        format: 'A4',
        displayHeaderFooter: true,
        ...generateHeaderFooter(titlePDF, imgPDF),
    };
    if (pageRanges) pdfOptions.pageRanges = pageRanges;

    const pdf = await page.pdf(pdfOptions);
    await browser.close();
    return pdf;
};

// Rota para gerar o PDF completo
app.post('/generate-pdf', async (req, res) => {
    const { fullTableHTML, titlePDF, imgPDF } = req.body;

    if (!fullTableHTML) return res.status(400).send('O campo "html" é obrigatório.');

    try {
        const pdf = await generatePDF(fullTableHTML, titlePDF, imgPDF);
        res.contentType("application/pdf").send(pdf);
    } catch (error) {
        console.error('Erro ao gerar o PDF:', error);
        res.status(500).send('Erro ao gerar o PDF.');
    }
});

// Rota para gerar a pré-visualização do PDF (primeira página)
app.post('/preview-pdf', async (req, res) => {
    const { fullTableHTML, titlePDF, imgPDF } = req.body;

    if (!fullTableHTML) return res.status(400).send('O campo "html" é obrigatório.');

    try {
        const pdfBuffer = await generatePDF(fullTableHTML, titlePDF, imgPDF,  '1');
        res.contentType("application/pdf").send(pdfBuffer);
    } catch (error) {
        console.error('Erro ao gerar a pré-visualização:', error);
        res.status(500).send('Erro ao gerar a pré-visualização.');
    }
});

app.listen(3001, () => {
    console.log('Servidor rodando na porta 3001');
});
