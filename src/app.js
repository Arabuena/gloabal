const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const indexRouter = require('./routes/index');

const app = express();

// Configurações básicas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Configuração do CORS
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? 'https://move-ah77.onrender.com'
        : 'http://localhost:3000',
    credentials: true
}));

// Log de requisições
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, {
        body: req.body,
        cookies: req.cookies
    });
    next();
});

// Rotas
app.use('/', indexRouter);

// Tratamento de erro 404
app.use((req, res) => {
    res.status(404).render('errors/404');
});

// Tratamento de erros
app.use((err, req, res, next) => {
    console.error('Erro:', err);
    res.status(500).json({ message: 'Erro interno do servidor' });
});

module.exports = app; 