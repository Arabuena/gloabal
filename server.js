require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const indexRouter = require('./src/routes/index');
const fs = require('fs');
const monitor = require('./src/utils/monitor');
const http = require('http');
const SocketService = require('./src/services/socketService');

const app = express();

// Log de caminhos importantes
console.log('\n=== Configuração de Caminhos ===');
console.log('Views:', path.join(__dirname, 'src', 'views'));
console.log('Public:', path.join(__dirname, 'src', 'public'));
console.log('============================\n');

// Configurações básicas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// Log detalhado de requisições com verificação de arquivos
app.use((req, res, next) => {
    console.log('\n=== Nova Requisição ===');
    console.log('Método:', req.method);
    console.log('URL:', req.url);
    console.log('Path:', req.path);
    console.log('Query:', req.query);
    console.log('Body:', req.body);
    console.log('Cookies:', req.cookies);
    
    // Verifica se é uma requisição de arquivo
    if (req.path.includes('.')) {
        const filePath = path.join(__dirname, 'src', 'public', req.path);
        console.log('Arquivo solicitado:', filePath);
        console.log('Arquivo existe:', require('fs').existsSync(filePath));
    }
    
    console.log('====================\n');
    next();
});

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'src', 'public')));
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? 'https://move-ah77.onrender.com'
        : 'http://localhost:3000',
    credentials: true
}));

// Adicione logo após a configuração do express.static
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
});

// Adicione este middleware após a configuração do express.static
app.use((req, res, next) => {
    if (req.url.includes('/css/styles.css')) {
        console.log('Requisição do CSS detectada');
        console.log('Path completo:', path.join(__dirname, 'src', 'public', 'css', 'styles.css'));
        console.log('Arquivo existe:', fs.existsSync(path.join(__dirname, 'src', 'public', 'css', 'styles.css')));
    }
    next();
});

// Antes das rotas, adicione verificação de diretórios
const directories = [
    path.join(__dirname, 'src', 'views'),
    path.join(__dirname, 'src', 'public'),
    path.join(__dirname, 'src', 'views', 'auth'),
    path.join(__dirname, 'src', 'views', 'driver'),
    path.join(__dirname, 'src', 'views', 'passenger')
];

console.log('\n=== Verificação de Diretórios ===');
directories.forEach(dir => {
    const exists = fs.existsSync(dir);
    console.log(`${dir}: ${exists ? 'OK' : 'NÃO ENCONTRADO'}`);
});
console.log('==============================\n');

// Rotas
app.use('/', indexRouter);
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/rides', require('./src/routes/rideRoutes'));
app.use('/passenger', require('./src/routes/passengerRoutes'));
app.use('/driver', require('./src/routes/driverRoutes'));

// Log detalhado de requisições com monitoramento
app.use((req, res, next) => {
    monitor.request(req);
    next();
});

// Erro 404
app.use((req, res) => {
    console.log('404 - Página não encontrada:', req.path);
    res.status(404).render('errors/404');
});

// Tratamento de erros com monitoramento
app.use((err, req, res, next) => {
    monitor.error('Erro na aplicação', err);
    res.status(500).json({ message: 'Erro interno do servidor' });
});

const server = http.createServer(app);
const socketService = new SocketService(server);

// Conectar ao MongoDB e iniciar servidor
console.log('Conectando ao MongoDB...');
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        monitor.log('system', 'Conectado ao MongoDB com sucesso');
        const port = process.env.PORT || 3000;
        server.listen(port, () => {
            monitor.log('system', `Servidor rodando na porta ${port}`);
        });
    })
    .catch((error) => {
        monitor.error('Erro ao conectar ao MongoDB', error);
        process.exit(1);
    }); 