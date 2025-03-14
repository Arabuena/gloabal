const fs = require('fs');
const path = require('path');

class Monitor {
    constructor() {
        this.logDir = path.join(process.cwd(), 'tmp', 'logs');
        this.ensureLogDir();
    }

    ensureLogDir() {
        try {
            if (!fs.existsSync(this.logDir)) {
                fs.mkdirSync(this.logDir, { recursive: true, mode: 0o777 });
            }
        } catch (error) {
            console.warn(`Aviso: Não foi possível criar/acessar o diretório de logs:`, error.message);
            // Em caso de erro, vamos apenas logar no console
            this.useConsoleOnly = true;
        }
    }

    log(type, message, data = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            type,
            message,
            data
        };
        
        // Em produção, você pode querer enviar para um serviço de logging
        if (process.env.NODE_ENV === 'production') {
            console.log(JSON.stringify(logEntry));
        } else {
            console.log(`[${type}] ${message}`, data);
        }
    }

    error(message, error) {
        const errorData = {
            message: error.message,
            stack: error.stack
        };
        
        // Em produção, você pode querer enviar para um serviço de logging
        if (process.env.NODE_ENV === 'production') {
            console.error(JSON.stringify({
                timestamp: new Date().toISOString(),
                type: 'ERROR',
                message,
                error: errorData
            }));
        } else {
            console.error(`[ERROR] ${message}:`, error);
        }
    }

    request(req) {
        this.log('request', `${req.method} ${req.path}`, {
            query: req.query,
            body: req.body,
            cookies: req.cookies
        });
    }

    auth(message, user) {
        this.log('auth', message, {
            userId: user?.id,
            role: user?.role
        });
    }
}

module.exports = new Monitor(); 