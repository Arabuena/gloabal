const fs = require('fs');
const path = require('path');

const directories = [
    './tmp/public',
    './tmp/public/js',
    './tmp/public/css',
    './tmp/public/img',
    './tmp/logs',
    'src/views',
    'src/views/passenger',
    'src/views/driver'
];

console.log('\n=== Criando diretórios necessários ===');

directories.forEach(dir => {
    try {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true, mode: 0o777 });
            console.log(`Diretório criado: ${dir}`);
        } else {
            console.log(`Diretório já existe: ${dir}`);
        }
    } catch (error) {
        console.warn(`Aviso: Não foi possível criar/verificar o diretório ${dir}:`, error.message);
    }
});

console.log('===================================\n'); 