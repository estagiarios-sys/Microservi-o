const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const app = express();

app.use(express.json({ limit: '10mb' })); // Aceita grandes quantidades de dados

const imageToBase64 = (path) => {
    const file = fs.readFileSync(path);
    return `data:image/png;base64,${file.toString('base64')}`;
};

const base64Image = imageToBase64('img/logo.png');

app.post('/generate-pdf', async (req, res) => {
    const { fullTableHTML, titlePDF, imgPDF } = req.body;

    if (!fullTableHTML) {
        return res.status(400).send('O corpo da requisição deve conter o campo "html" com o conteúdo da tabela.');
    }

    if (titlePDF === '') {
        titlePDF = 'Relatório';
    }

    if (imgPDF === '') {
        imgPDF = base64Image;
    }

    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // Define o conteúdo HTML com Tailwind CSS
        const fullHtml = `
            <html>
            <head>
                <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                <style>
                    @page { 
                        margin-top: 100px; 
                        margin-bottom: 50px; 
                        margin-left: 30px; 
                        margin-right: 30px; 
                    }
                    body { font-family: Arial, sans-serif; }
                </style>
            </head>
            <body>
                ${fullTableHTML}
            </body>
            </html>
        `;

        // Define o conteúdo HTML no Puppeteer
        await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

        // Aguarda alguns segundos para garantir que o HTML seja renderizado corretamente
        await page.waitForTimeout(2000);

        // Gera o PDF com cabeçalho e rodapé
        const pdf = await page.pdf({
            printBackground: true,
            format: 'A4',
            displayHeaderFooter: true,
            headerTemplate: `
                <div style="width: 100%; position: relative; padding: 0 20px; box-sizing: border-box; height: 50px; display: flex; align-items: center;">
                    <img alt="Logo Systextil" style="height: 30px; position: absolute; left: 20px;" src="${base64Image}" />
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
                </div>`,
        });

        await browser.close();

        res.contentType("application/pdf");
        res.send(pdf); // Envia o PDF gerado
    } catch (error) {
        console.error('Erro ao gerar o PDF:', error);
        res.status(500).send('Erro ao gerar o PDF.');
    }
});

app.post('/preview-pdf', async (req, res) => {
    const { fullTableHTML, titlePDF, imgPDF } = req.body;

    if (!fullTableHTML) {
        return res.status(400).send('O corpo da requisição deve conter o campo "html" com o conteúdo da tabela.');
    }

    if (titlePDF === '') {
        titlePDF = 'Relatório';
    }

    if (imgPDF === '') {
        imgPDF = base64Image;
    }
    
    try {
        const browser = await puppeteer.launch({
            headless: true, // Modo headless para performance
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // Define o conteúdo HTML com Tailwind CSS para pré-visualização
        const fullHtml = `
            <html>
            <head>
                <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                <style>
                    @page { 
                        margin-top: 100px; 
                        margin-bottom: 100px; 
                        margin-left: 50px; 
                        margin-right: 50px; 
                    }
                    body { font-family: Arial, sans-serif; }
                </style>
            </head>
            <body>
                ${fullTableHTML}
            </body>
            </html>
        `;

        // Define o conteúdo HTML no Puppeteer
        await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

        // Aguarda alguns segundos para garantir que o HTML seja renderizado corretamente
        await page.waitForTimeout(2000);

        // Gera o PDF com apenas a primeira página, cabeçalho e rodapé
        const pdfBuffer = await page.pdf({
            printBackground: true,
            format: 'A4',
            pageRanges: '1', // Gera apenas a primeira página
            displayHeaderFooter: true,
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
                </div>`,
        });

        await browser.close();

        res.contentType("application/pdf");
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Erro ao gerar a pré-visualização:', error);
        res.status(500).send('Erro ao gerar a pré-visualização.');
    }
});

app.listen(3001, () => {
    console.log('Servidor rodando na porta 3001');
});
