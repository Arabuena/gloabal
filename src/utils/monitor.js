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
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            type,
            message,
            data
        };

        // Sempre loga no console
        console.log(`[${type.toUpperCase()}] ${message}`, data);

        // Se não pudermos usar arquivos, retornamos aqui
        if (this.useConsoleOnly) {
            return;
        }

        try {
            const logFile = path.join(this.logDir, `${type}-${new Date().toISOString().split('T')[0]}.log`);
            fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
        } catch (error) {
            console.warn('Erro ao escrever no arquivo de log:', error.message);
            this.useConsoleOnly = true; // Desativa logs em arquivo após erro
        }
    }

    error(message, error) {
        this.log('error', message, {
            error: error.message,
            stack: error.stack
        });
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