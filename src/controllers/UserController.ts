import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { UserService } from "../services/UserService";
import { SUCCESS, FAILURE, USER_CREATION_FAILED, EMAIL_VERIFY_FAILED, LOGIN_FAILED, NAME_MISSING } from "../utils/Constant";
import { WalletService } from '../services/WalletService';
import { JwtPayload } from '../utils/Interfaces';

export class UserController {
    
    constructor(private readonly userService: UserService) {
      const walletService = new WalletService();
      this.userService.setWalletService(walletService);
    }

    public async registerUser(request: FastifyRequest, reply: FastifyReply, fastify: FastifyInstance):Promise<any> {
        const { name, username, email, password } = request.body as {name: string, username: string, email: string, password: string};
        try {

          const response = await this.userService.registerUser({name: name.trim(), username: username.trim(), email: email.trim(), password }, fastify);
          reply.send(response);

        } catch (error) {
          console.log(error);
          reply.status(400).send(USER_CREATION_FAILED);
        }
    }


    public async verifyEmail(request: FastifyRequest, reply: FastifyReply, fastify: FastifyInstance){
      const { token } = request.query as {token: string};
      try {
        const response = await this.userService.verifyEmail(token, fastify);
        reply.send(response);
      } catch (error) {
        reply.status(400).send(EMAIL_VERIFY_FAILED);
      }
    }

    
    public async authenticateUser(request: FastifyRequest, reply: FastifyReply, fastify: FastifyInstance):Promise<any> {
        const { username, password } = request.body as {username: string, password: string};
        try {
          const response = await this.userService.signInUser({username, password}, fastify);
          reply.send(response);
        } catch (error) {
          reply.status(400).send(LOGIN_FAILED);
        }
    }


    public async getUser(request: FastifyRequest, reply: FastifyReply) {
      try {
          // const userId = (request.user as JwtPayload).userId; // Extract userId from the JWT token  
          const { name } = request.query as {name: string};
          if (name && name != undefined) {
            const userResponse = await this.userService.getUserDetailsByName(name);
            return reply.send(userResponse);
          }  
          return reply.send(NAME_MISSING);    
          
      } catch (error) {
          console.error(error);
          reply.status(500).send({ message: 'Failed to retrieve User' });
      }
    }


}