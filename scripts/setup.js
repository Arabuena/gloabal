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
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
    <div class="container">
        <div class="role-selection-container">
            <h1>Bem-vindo ao Move</h1>
            <div class="role-selection">
                <a href="/passenger" class="role-button">Sou Passageiro</a>
                <a href="/driver" class="role-button">Sou Motorista</a>
            </div>
        </div>
    </div>
</body>
</html>`;
    fs.writeFileSync(selectRolePath, selectRoleContent);
    console.log('Arquivo select-role.ejs criado');
}

// Criar arquivo 500.ejs se não existir
const error500Path = 'src/views/errors/500.ejs';
if (!fs.existsSync(error500Path)) {
    const error500Content = `
<!DOCTYPE html>
<html>
<head>
    <title>500 - Erro Interno</title>
    <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
    <div class="error-container">
        <h1>500 - Erro Interno do Servidor</h1>
        <p>Desculpe, algo deu errado no servidor.</p>
        <a href="/">Voltar para a página inicial</a>
    </div>
</body>
</html>`;
    fs.writeFileSync(error500Path, error500Content);
    console.log('Arquivo 500.ejs criado');
}

// Criar arquivo passenger-login.ejs
const passengerLoginPath = 'src/views/auth/passenger-login.ejs';
if (!fs.existsSync(passengerLoginPath)) {
    const passengerLoginContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Login - Passageiro</title>
    <link rel="stylesheet" href="/css/styles.css">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
    <div class="container">
        <div class="auth-container">
            <h1>Login do Passageiro</h1>
            <form id="loginForm" class="auth-form">
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" required>
                </div>
                <div class="form-group">
                    <label for="password">Senha</label>
                    <input type="password" id="password" name="password" required>
                </div>
                <button type="submit" class="primary-btn">Entrar</button>
            </form>
            <p class="auth-links">
                <a href="/register">Criar conta</a> |
                <a href="/">Voltar</a>
            </p>
        </div>
    </div>
    <script src="/js/auth.js"></script>
</body>
</html>`;
    fs.writeFileSync(passengerLoginPath, passengerLoginContent);
    console.log('Arquivo passenger-login.ejs criado');
}

// Criar arquivo driver-login.ejs
const driverLoginPath = 'src/views/auth/driver-login.ejs';
if (!fs.existsSync(driverLoginPath)) {
    const driverLoginContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Login - Motorista</title>
    <link rel="stylesheet" href="/css/styles.css">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
    <div class="container">
        <div class="auth-container">
            <h1>Login do Motorista</h1>
            <form id="loginForm" class="auth-form">
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" required>
                </div>
                <div class="form-group">
                    <label for="password">Senha</label>
                    <input type="password" id="password" name="password" required>
                </div>
                <button type="submit" class="primary-btn">Entrar</button>
            </form>
            <p class="auth-links">
                <a href="/register">Criar conta</a> |
                <a href="/">Voltar</a>
            </p>
        </div>
    </div>
    <script src="/js/auth.js"></script>
</body>
</html>`;
    fs.writeFileSync(driverLoginPath, driverLoginContent);
    console.log('Arquivo driver-login.ejs criado');
}

// Criar arquivo auth.js se não existir
const authJsPath = 'src/public/js/auth.js';
if (!fs.existsSync(authJsPath)) {
    const authJsContent = `document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // Determina se é login de passageiro ou motorista pela URL
            const isPassenger = window.location.pathname.includes('passenger');
            const endpoint = isPassenger ? '/auth/passenger/login' : '/auth/driver/login';
            
            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    window.location.href = data.redirect;
                } else {
                    alert(data.message || 'Erro ao fazer login');
                }
            } catch (error) {
                console.error('Erro:', error);
                alert('Erro ao fazer login. Tente novamente.');
            }
        });
    }
});`;
    fs.writeFileSync(authJsPath, authJsContent);
    console.log('Arquivo auth.js criado');
}

console.log('===================================\n'); 