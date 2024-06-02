import { FastifyInstance } from 'fastify';
import { WalletController } from '../controllers/WalletController';
import { jwtAuthMiddleware } from '../middlewares/jwtAuthMiddleware'; // Import the middleware

export function WalletRoutes(fastify: FastifyInstance, opts: any, done: () => void) {
    const walletController = new WalletController();

    // Protect the checkBalance route with JWT middleware
    fastify.get('/wallet/checkBalance', { preHandler: [jwtAuthMiddleware] }, async (request, reply) => {
        return await walletController.checkBalance(request, reply);
    });

    fastify.get('/wallet/getTransactionHistory', { preHandler: [jwtAuthMiddleware] }, async (request, reply) => {
        return await walletController.getTransactionHistory(request, reply);
    });

    fastify.post('/wallet/topUp', { preHandler: [jwtAuthMiddleware] }, async (request, reply) => {
        return await walletController.topUpBalance(request, reply);
    });

    fastify.post('/transferMoney', { preHandler: [jwtAuthMiddleware] }, async (request, reply) => {
        return await walletController.transferMoney(request, reply);
    });

    done();
}
