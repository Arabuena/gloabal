// Autenticação baseada em papéis (motorista/passageiro) 
const User = require('../models/User');

function roleAuth(roles = []) {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Não autenticado' });
            }

            const user = await User.findById(req.user.id);
            
            if (!user) {
                return res.status(401).json({ message: 'Usuário não encontrado' });
            }

            if (roles.length && !roles.includes(user.role)) {
                return res.status(403).json({ 
                    message: 'Não autorizado para esta ação' 
                });
            }

            next();
        } catch (error) {
            console.error('Erro na verificação de papel:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    };
}

module.exports = roleAuth; 