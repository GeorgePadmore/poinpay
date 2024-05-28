import { FastifyReply, FastifyRequest } from 'fastify';
import UserService from "../services/UserService";

export class UserController {
    
    constructor(private readonly userService: UserService) {}

    async registerUser(request: FastifyRequest, reply: FastifyReply ):Promise<any> {
        const { username, email, password } = request.body as {username: string, email: string, password: string};
        try {
          const user = await this.userService.createUser(username, email, password);
          reply.status(201).send(user);
        } catch (error) {
          reply.status(400).send({ error: 'Could not create user' });
        }
    }


    async getUsers(request: FastifyRequest, reply: FastifyReply): Promise<any> {
        const users = await this.userService.getUsers();
        reply.status(201).send(users);
    }
}