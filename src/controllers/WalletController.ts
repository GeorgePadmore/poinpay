import { FastifyReply, FastifyRequest } from 'fastify';
import { WalletService } from '../services/WalletService';
import { JwtPayload } from 'utils/Interfaces';
import { UserService } from '../services/UserService';

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
            const balance = await this.walletService.getUserBalance({userId})
            reply.send(balance);
        } catch (error) {
            console.error(error);
            reply.status(500).send({ message: 'Failed to retrieve balance' });
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
            reply.status(500).send({ message: 'Failed to retrieve balance' });
        }
    }
}
