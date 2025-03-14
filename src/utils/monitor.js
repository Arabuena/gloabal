const fs = require('fs');
const path = require('path');

class Monitor {
    constructor() {
        this.logDir = path.join(__dirname, '..', '..', 'logs');
        this.ensureLogDir();
    }

    ensureLogDir() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
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

        const logFile = path.join(this.logDir, `${type}-${new Date().toISOString().split('T')[0]}.log`);
        fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');

        // Log no console também
        console.log(`[${type.toUpperCase()}] ${message}`, data);
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