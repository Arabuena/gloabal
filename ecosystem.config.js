module.exports = {
    apps: [{
        name: 'move-app',
        script: 'src/server.js',
        instances: 'max',
        exec_mode: 'cluster',
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env_production: {
            NODE_ENV: 'production',
            PORT: 3000
        }
    }]
}; 