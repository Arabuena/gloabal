const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const monitor = require('../utils/monitor');

class AuthController {
    // Login do usuário (passageiro ou motorista)
    async login(req, res) {
        try {
            const { email, password } = req.body;

            // Validação básica
            if (!email || !password) {
                return res.status(400).json({ 
                    message: 'Email e senha são obrigatórios' 
                });
            }

            // Busca usuário
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({ message: 'Credenciais inválidas' });
            }

            // Verifica senha
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({ message: 'Credenciais inválidas' });
            }

            // Gera token JWT
            const token = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            // Remove senha do objeto de resposta
            const userResponse = user.toObject();
            delete userResponse.password;

            // Log de login
            monitor.log('auth', `Login bem sucedido - ${user.role}`, { userId: user._id });

            // Redireciona baseado no papel do usuário
            const redirectUrl = user.role === 'passenger' 
                ? '/passenger/dashboard'
                : '/driver/dashboard';

            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000 // 24 horas
            }).redirect(redirectUrl);
        } catch (error) {
            monitor.error('Erro no login', error);
            res.status(500).json({ message: 'Erro ao fazer login' });
        }
    }

    // Registro de novo passageiro
    async registerPassenger(req, res) {
        try {
            const { name, email, password, phone } = req.body;

            // Validações
            if (!name || !email || !password || !phone) {
                return res.status(400).json({ 
                    message: 'Todos os campos são obrigatórios' 
                });
            }

            // Verifica se email já existe
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'Email já cadastrado' });
            }

            // Cria novo usuário
            const user = new User({
                name,
                email,
                password: await bcrypt.hash(password, 10),
                phone,
                role: 'passenger',
                createdAt: new Date()
            });

            await user.save();

            // Remove senha do objeto de resposta
            const userResponse = user.toObject();
            delete userResponse.password;

            // Gera token JWT
            const token = jwt.sign(
                { id: user._id, role: 'passenger' },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            monitor.log('auth', 'Novo passageiro registrado', { userId: user._id });

            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000
            }).status(201).json({
                user: userResponse,
                token
            });
        } catch (error) {
            monitor.error('Erro no registro', error);
            res.status(500).json({ message: 'Erro ao registrar usuário' });
        }
    }

    // Logout
    async logout(req, res) {
        try {
            res.clearCookie('token').json({ success: true });
        } catch (error) {
            monitor.error('Erro no logout', error);
            res.status(500).json({ message: 'Erro ao fazer logout' });
        }
    }
}

module.exports = new AuthController(); 