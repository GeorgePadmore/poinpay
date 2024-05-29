import { FastifyInstance } from "fastify";
import { UserController } from "../controllers/UserController";
import { UserService } from "../services/UserService";
import { dataSource } from "../utils/database/DataSource"; // Import your DataSource
import { User } from "../models/User";
import { UserRepository } from '../repositories/UserRepository';
import { SignupSchema } from "../../schemas/SignupSchema";


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


    /*
    fastify.post("/login", async (request, reply) => {
        const user = await userController.registerUser(request, reply);
        const payload = { userId: user.id, username: user.username, email: user.email }
        const token = fastify.jwt.sign(payload);

        return {respCode: '000', responseMessage: "Login successful",  }
    });
    */


    // POST /api/register: Register a new user.
    // POST /api/login: Authenticate a user.
    // POST /api/verify-email: Verify user's email.

    done();
}
