import { FastifyReply, FastifyRequest } from 'fastify';
import { WalletService } from '../services/WalletService';
import { JwtPayload } from '../utils/Interfaces';
import { UserService } from '../services/UserService';
import { ACCOUNT_TOPUP_FAILED, TRANSACTION_FAILED } from '../utils/Constant';

export class WalletController {
    private walletService: WalletService;

    constructor() {
        this.walletService = new WalletService();
        const userService = new UserService();

        this.walletService.setUserService(userService); //set dependency
    }

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
