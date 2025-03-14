const fs = require('fs');
const path = require('path');

const directories = [
    'src/public/js',
    'src/public/css',
    'src/views/passenger'
];

console.log('\n=== Verificando diretórios necessários ===');

directories.forEach(dir => {
    try {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`Diretório criado: ${dir}`);
        } else {
            console.log(`Diretório já existe: ${dir}`);
        }
    } catch (error) {
        console.warn(`Aviso: Não foi possível verificar o diretório ${dir}:`, error.message);
    }
});

console.log('===================================\n'); 