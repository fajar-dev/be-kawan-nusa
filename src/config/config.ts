/**
 * Global Application Configuration
 * All environment variables are centralized here
 */
export const config = {
    app: {
        port: Number(process.env.PORT) || 3000,
        appUrl: process.env.APP_URL || 'http://localhost:4000',
        env: process.env.NODE_ENV || 'development',
        jwtSecret: process.env.JWT_SECRET || 'supersecretkey',
        jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'superrefreshsecretkey',
        apiKey: process.env.API_KEY || 'secretapikey',
    },
    database: {
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        pass: process.env.DB_PASS || '',
        name: process.env.DB_NAME || 'kawan_nusa',
        sync: Boolean(process.env.DB_SYNC) || false,
    },
    mail: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 587,
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
        from: process.env.SMTP_FROM || '"Kawan Nusa" <kawan@nusa.net.id>',
    },
    feedback: {
        scriptUrl: process.env.FEEDBACK_URL || '',
    },
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
    googleSheet: {
        serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
        privateKey: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID || '',
    },
    nis: {
        host: process.env.NIS_DB_HOST || '127.0.0.1',
        port: Number(process.env.NIS_DB_PORT) || 3306,
        user: process.env.NIS_DB_USER || 'root',
        pass: process.env.NIS_DB_PASS || '',
        name: process.env.NIS_DB_NAME || '',
    },
}

