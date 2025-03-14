const fs = require('fs');
const path = require('path');

// Apenas diretórios essenciais
const directories = [
    'src/views',
    'src/views/passenger',
    'src/views/driver',
    'src/public',
    'src/public/js',
    'src/public/css'
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