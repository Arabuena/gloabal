module.exports = {
    port: process.env.PORT || 3000,
    mongoUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    googleMapsKey: process.env.GOOGLE_MAPS_API_KEY,
    stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
    },
    firebase: {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY
    },
    cors: {
        origin: [
            'https://move-ah77.onrender.com',
            'http://localhost:3000'
        ],
        credentials: true
    },
    cookie: {
        secure: true,
        sameSite: 'none',
        domain: '.onrender.com'
    },
    baseUrl: 'https://move-ah77.onrender.com'
}; 