import { FastifyReply, FastifyRequest } from 'fastify';
import { WalletService } from '../services/WalletService';
import { UserService } from '../services/UserService';
import { NotificationService } from '../services/NotificationService';
import { JwtPayload } from '../utils/Interfaces';
import { ACCOUNT_TOPUP_FAILED, TRANSACTION_FAILED } from '../utils/Constant';

/**
 * Controller class for handling wallet-related routes and requests.
 */
export class WalletController {
    private walletService: WalletService;

    constructor() {
        this.walletService = new WalletService();
        const userService = new UserService();
        const notificationService = new NotificationService();

        this.walletService.setUserService(userService); //set dependency
        this.walletService.setNotificationService(notificationService);
    }


    /**
     * Route handler for checking the user's wallet balance.
     * @param {FastifyRequest} request - The request object.
     * @param {FastifyReply} reply - The reply object.
     */
    public async checkBalance(request: FastifyRequest, reply: FastifyReply) {
        try {
            const userId = (request.user as JwtPayload).userId; // Extract userId from the JWT token        
            const balanceResponse = await this.walletService.getUserBalance({userId})
            reply.send(balanceResponse);
        } catch (error) {
            console.error(error);
            reply.status(500).send({ message: 'Failed to retrieve balance' });
        }
    }

    
    /**
     * Route handler for retrieving the user's transaction history.
     * @param {FastifyRequest} request - The request object.
     * @param {FastifyReply} reply - The reply object.
     */
    public async getTransactionHistory(request: FastifyRequest, reply: FastifyReply) {
        try {
            const userId = (request.user as JwtPayload).userId; // Extract userId from the JWT token        
            const transactionHistoryResponse = await this.walletService.getTransactionHistoryList({userId})
            reply.send(transactionHistoryResponse);
        } catch (error) {
            console.error(error);
            reply.status(500).send({ message: 'Failed to retrieve transaction history' });
        }
    }


    /**
     * Route handler for topping up the user's wallet balance.
     * @param {FastifyRequest} request - The request object.
     * @param {FastifyReply} reply - The reply object.
     */
    public async topUpBalance(request: FastifyRequest, reply: FastifyReply) {
        try {
            const userId = (request.user as JwtPayload).userId; // Extract userId from the JWT token     
            const { amount } = request.body as {amount: number}

            const topupResponse = await this.walletService.topUpBalance({userId, amount})
            reply.send(topupResponse);
        } catch (error) {
            console.error(error);
            reply.status(500).send(ACCOUNT_TOPUP_FAILED);
        }
    }

    
    /**
     * Route handler for transferring money from one user's wallet to another.
     * @param {FastifyRequest} request - The request object.
     * @param {FastifyReply} reply - The reply object.
     */
    public async transferMoney(request: FastifyRequest, reply: FastifyReply) {
        try {
            const senderId = (request.user as JwtPayload).userId; // Extract userId from the JWT token     
            const { idempotencyKey, recipientId, amount } = request.body as { idempotencyKey: string, amount: number, recipientId: number}

            const transferResponse = await this.walletService.transferMoney({ senderId, idempotencyKey, recipientId, amount });
            reply.send(transferResponse);
        } catch (error) {
            console.error(error);
            reply.status(500).send(TRANSACTION_FAILED);
        }
    }
}
