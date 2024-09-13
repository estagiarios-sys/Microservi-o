const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const app = express();

app.use(express.json({ limit: '10mb' })); // Aceita grandes quantidades de dados

// Função para converter imagem para base64
const imageToBase64 = (path) => {
    const file = fs.readFileSync(path);
    return `data:image/png;base64,${file.toString('base64')}`;
};

// Converte a imagem para base64
const base64Image = imageToBase64('img/logo.png');

// ========================= GERAÇÃO DE PDF =========================
app.post('/generate-pdf', async (req, res) => {
    const { html } = req.body;

    if (!html) {
        return res.status(400).send('O corpo da requisição deve conter o campo "html" com o conteúdo da tabela.');
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
                ${html}
            </body>
            </html>
        `;

        // Salva o conteúdo HTML em um arquivo local para visualização e teste
        fs.writeFileSync('preview.html', fullHtml);

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
                        <span>Relatório</span>
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
            margin: {
                top: '10px',
                bottom: '10px',
                right: '20px',
                left: '20px'
            }
        });

        await browser.close();

        res.contentType("application/pdf");
        res.send(pdf); // Envia o PDF gerado
    } catch (error) {
        console.error('Erro ao gerar o PDF:', error);
        res.status(500).send('Erro ao gerar o PDF.');
    }
});

// ========================= TESTE DO RODAPÉ =========================
// Código de teste para visualizar o rodapé no navegador

// Salva o HTML de teste em um arquivo local para visualização
const generateTestHtml = () => {
    const testHtml = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            <style>
                @page { margin: 50px; }
                body { font-family: Arial, sans-serif; }
            </style>
            <title>Teste de Rodapé</title>
        </head>
        <body>
            <div style="font-size:5px; width:100%; text-align:center; color: grey; display: flex; justify-content: space-between; align-items: center; padding: 0 20px; box-sizing: border-box;">
                <span style="flex: 1; text-align: left; white-space: nowrap;">© Copyright 2024 - Systextil - Todos os direitos reservados</span>
                <img src="${base64Image}" alt="Logo Systextil" style="max-height: 30px; margin: 0 10px;" />
                <span style="flex: 1; text-align: right;">Simplificando a cadeia têxtil!</span>
                <span class="pageNumber" style="flex: 1; text-align: right; white-space: nowrap;">Página <span class="pageNumber">1</span> de <span class="totalPages">3</span></span>
            </div>
        </body>
        </html>
    `;

    // Salva o HTML de teste em um arquivo para ser visualizado
    fs.writeFileSync('teste-rodape.html', testHtml);
};

// Chama a função para gerar o HTML de teste
generateTestHtml();

app.listen(3001, () => {
    console.log('Servidor rodando na porta 3001');
});
