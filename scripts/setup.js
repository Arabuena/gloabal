const fs = require('fs');
const path = require('path');

const directories = [
    'src/public',
    'src/public/css',
    'src/public/js',
    'src/public/img',
    'src/views',
    'src/views/passenger',
    'src/views/driver',
    'src/views/auth'
];

console.log('\n=== Criando diretórios necessários ===');

directories.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`Diretório criado: ${dir}`);
    } else {
        console.log(`Diretório já existe: ${dir}`);
    }
});

console.log('===================================\n'); 