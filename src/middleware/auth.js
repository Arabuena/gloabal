const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
    try {
        // Verifica token no cookie
        const token = req.cookies.token;
        
        if (!token) {
            return res.redirect('/select-role');
        }

        // Verifica validade do token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Busca usuário atualizado no banco
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            res.clearCookie('token');
            return res.redirect('/select-role');
        }

        // Adiciona usuário ao request
        req.user = user;
        next();
    } catch (error) {
        console.error('Erro de autenticação:', error);
        res.clearCookie('token');
        res.redirect('/select-role');
    }
}; 