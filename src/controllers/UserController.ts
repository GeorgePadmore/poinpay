import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { UserService } from "../services/UserService";
import { SUCCESS, FAILURE, USER_CREATION_FAILED, EMAIL_VERIFY_FAILED, LOGIN_FAILED } from "../utils/constant";

export class UserController {
    
    constructor(private readonly userService: UserService) {}

    async registerUser(request: FastifyRequest, reply: FastifyReply, fastify: FastifyInstance):Promise<any> {
        const { name, username, email, password } = request.body as {name: string, username: string, email: string, password: string};
        try {

          const response = await this.userService.registerUser({name: name.trim(), username: username.trim(), email: email.trim(), password }, fastify);
          reply.send(response);

        } catch (error) {
          console.log(error);
          reply.status(400).send(USER_CREATION_FAILED);
        }
    }


    async verifyEmail(request: FastifyRequest, reply: FastifyReply, fastify: FastifyInstance){
      const { token } = request.query as {token: string};
      try {
        const response = await this.userService.verifyEmail(token, fastify);
        reply.send(response);
      } catch (error) {
        reply.status(400).send(EMAIL_VERIFY_FAILED);
      }
    }

    
    async authenticateUser(request: FastifyRequest, reply: FastifyReply, fastify: FastifyInstance):Promise<any> {
        const { username, password } = request.body as {username: string, password: string};
        try {
          const response = await this.userService.signInUser({username, password}, fastify);
          reply.send(response);
        } catch (error) {
          reply.status(400).send(LOGIN_FAILED);
        }
    }


}