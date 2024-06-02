import { FastifyInstance } from 'fastify';
import { WalletController } from '../controllers/WalletController';
import { jwtAuthMiddleware } from '../middlewares/jwtAuthMiddleware'; // Import the middleware

/**
 * Defines routes related to wallet operations.
 * @param {FastifyInstance} fastify - The Fastify instance.
 * @param {any} opts - Options passed to the route.
 * @param {() => void} done - Callback to indicate that the route definition is complete.
 */
export function WalletRoutes(fastify: FastifyInstance, opts: any, done: () => void) {
    const walletController = new WalletController();

    // Protect the checkBalance route with JWT middleware
    /**
     * Route to check the user's wallet balance.
     * @param {FastifyInstance} request - The request object.
     * @param {FastifyInstance} reply - The reply object.
     */
    fastify.get('/wallet/checkBalance', { preHandler: [jwtAuthMiddleware] }, async (request, reply) => {
        return await walletController.checkBalance(request, reply);
    });


    /**
     * Route to get the user's transaction history.
     * @param {FastifyInstance} request - The request object.
     * @param {FastifyInstance} reply - The reply object.
     */
    fastify.get('/wallet/getTransactionHistory', { preHandler: [jwtAuthMiddleware] }, async (request, reply) => {
        return await walletController.getTransactionHistory(request, reply);
    });


    /**
     * Route to top up the user's wallet balance.
     * @param {FastifyInstance} request - The request object.
     * @param {FastifyInstance} reply - The reply object.
     */
    fastify.post('/wallet/topUp', { preHandler: [jwtAuthMiddleware] }, async (request, reply) => {
        return await walletController.topUpBalance(request, reply);
    });


    /**
     * Route to transfer money from one user's wallet to another.
     * @param {FastifyInstance} request - The request object.
     * @param {FastifyInstance} reply - The reply object.
     */
    fastify.post('/transferMoney', { preHandler: [jwtAuthMiddleware] }, async (request, reply) => {
        return await walletController.transferMoney(request, reply);
    });

    done();
}
