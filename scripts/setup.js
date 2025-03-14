const fs = require('fs');
const path = require('path');

// Verifica se o server.js existe na raiz
if (!fs.existsSync('server.js')) {
    fs.writeFileSync('server.js', "require('./src/server.js');");
    console.log('Arquivo server.js criado na raiz');
}

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