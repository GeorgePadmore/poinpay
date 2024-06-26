import * as dotenv from 'dotenv';
dotenv.config();

export const jwtConfig = {
    secret: process.env.JWT_SECRET_KEY,
    sign: {
        expiresIn: '24h' // Token expiration time
    }
};