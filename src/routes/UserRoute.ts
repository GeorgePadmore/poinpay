import { FastifyInstance } from "fastify";
import { UserController } from "../controllers/UserController";
import { UserService } from "../services/UserService";
import { dataSource } from "../utils/database/DataSource"; // Import your DataSource
import { User } from "../models/User";
import { UserRepository } from '../repositories/UserRepository';
import { SignupSchema } from "../../schemas/SignupSchema";
import { LoginSchema } from "../../schemas/LoginSchema";


export function UserRoutes(fastify: FastifyInstance, opts: any, done: () => void) {
  
    // const userRepository = dataSource.getRepository(User);
    const userRepository = new UserRepository();
    const userService = new UserService(userRepository); 
    const userController = new UserController(userService); 
    

    fastify.post("/signup", { schema: SignupSchema },  async (request, reply) => {
        return await userController.registerUser(request, reply, fastify);
    });

    fastify.get("/verify-email", async (request, reply) => {
        await userController.verifyEmail(request, reply, fastify);
    });


    fastify.post("/login", {schema: LoginSchema }, async (request, reply) => {
        return await userController.authenticateUser(request, reply, fastify);
    });
    


    // POST /api/register: Register a new user.
    // POST /api/login: Authenticate a user.
    // POST /api/verify-email: Verify user's email.

    done();
}
