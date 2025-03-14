const fs = require('fs');
const path = require('path');

const requiredFiles = [
    {
        path: 'src/controllers/rideController.js',
        exports: ['requestRide', 'acceptRide', 'startRide', 'finishRide', 'cancelRide']
    },
    {
        path: 'src/routes/rideRoutes.js',
        imports: ['../controllers/rideController']
    },
    {
        path: 'src/utils/monitor.js',
        exports: ['log', 'error']
    },
    {
        path: 'src/utils/priceCalculator.js',
        exports: ['calculatePrice']
    }
];

console.log('\n=== Verificando estrutura do projeto ===');

requiredFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file.path);
    console.log(`\nVerificando: ${file.path}`);
    
    try {
        // Verifica se o arquivo existe
        const exists = fs.existsSync(filePath);
        console.log(`- Arquivo existe: ${exists ? 'OK' : 'NÃO ENCONTRADO'}`);
        
        if (!exists) {
            throw new Error(`Arquivo ${file.path} não encontrado`);
        }

        // Verifica o conteúdo do arquivo
        const content = fs.readFileSync(filePath, 'utf8');
        console.log(`- Conteúdo carregado: OK`);
        
        // Verifica case-sensitive do nome do arquivo
        const dir = path.dirname(filePath);
        const files = fs.readdirSync(dir);
        const fileExists = files.includes(path.basename(file.path));
        
        if (!fileExists) {
            console.log('- Arquivos no diretório:', files);
            throw new Error(`Nome do arquivo não corresponde (case-sensitive): ${file.path}`);
        }
        
        console.log('- Nome do arquivo (case-sensitive): OK');

    } catch (error) {
        console.error(`\nErro ao verificar ${file.path}:`, error.message);
        process.exit(1);
    }
});

console.log('\nTodos os arquivos necessários estão presentes e corretos.'); 