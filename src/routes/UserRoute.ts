import { FastifyInstance } from "fastify";
import { UserController } from "../controllers/UserController";
import { UserService } from "../services/UserService";
import { dataSource } from "../utils/database/DataSource"; // Import your DataSource
import { User } from "../models/User";
import { UserRepository } from '../repositories/UserRepository';
import { SignupSchema } from "../../schemas/SignupSchema";
import { LoginSchema } from "../../schemas/LoginSchema";
import { jwtAuthMiddleware } from "../middlewares/jwtAuthMiddleware";


export function UserRoutes(fastify: FastifyInstance, opts: any, done: () => void) {
  
    const userService = new UserService(); 
    const userController = new UserController(userService); 
    

    // Register a new user.
    fastify.post("/register", { schema: SignupSchema },  async (request, reply) => {
        return await userController.registerUser(request, reply, fastify);
    });

    // Verify user's email.
    fastify.get("/verify-email", async (request, reply) => {
        await userController.verifyEmail(request, reply, fastify);
    });


    // Authenticate a user.
    fastify.post("/login", {schema: LoginSchema }, async (request, reply) => {
        return await userController.authenticateUser(request, reply, fastify);
    });
    


    fastify.get('/getContact', { preHandler: [jwtAuthMiddleware] }, async (request, reply) => {
        return await userController.getUser(request, reply);
    });


    done();
}
