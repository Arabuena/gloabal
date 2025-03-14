const fs = require('fs');
const path = require('path');

// Verifica se o server.js existe na raiz
if (!fs.existsSync('server.js')) {
    fs.writeFileSync('server.js', "require('./src/server.js');");
    console.log('Arquivo server.js criado na raiz');
}

// Diretórios necessários
const directories = [
    'src/public/js',
    'src/public/css',
    'src/views',
    'src/views/auth',
    'src/views/passenger',
    'src/views/driver',
    'src/views/errors'
];

console.log('\n=== Verificando diretórios necessários ===');

// Criar diretórios
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

// Criar arquivo 404.ejs se não existir
const error404Path = 'src/views/errors/404.ejs';
if (!fs.existsSync(error404Path)) {
    const error404Content = `
<!DOCTYPE html>
<html>
<head>
    <title>404 - Página não encontrada</title>
</head>
<body>
    <h1>404 - Página não encontrada</h1>
    <p>A página que você está procurando não existe.</p>
    <a href="/">Voltar para a página inicial</a>
</body>
</html>`;
    fs.writeFileSync(error404Path, error404Content);
    console.log('Arquivo 404.ejs criado');
}

// Criar arquivo select-role.ejs se não existir
const selectRolePath = 'src/views/auth/select-role.ejs';
if (!fs.existsSync(selectRolePath)) {
    const selectRoleContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Selecione seu perfil</title>
    <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
    <div class="container">
        <h1>Bem-vindo ao Move</h1>
        <div class="role-selection">
            <a href="/passenger" class="role-button">Sou Passageiro</a>
            <a href="/driver" class="role-button">Sou Motorista</a>
        </div>
    </div>
</body>
</html>`;
    fs.writeFileSync(selectRolePath, selectRoleContent);
    console.log('Arquivo select-role.ejs criado');
}

console.log('===================================\n'); 