class Monitor {
    log(type, message, data = {}) {
        console.log(`[${type}] ${message}`, data);
    }

    error(message, error) {
        console.error(`[ERROR] ${message}:`, error);
    }

    request(req) {
        this.log('request', `${req.method} ${req.path}`, {
            query: req.query,
            body: req.body
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