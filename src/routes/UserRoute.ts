import { FastifyInstance } from "fastify";
import { UserController } from "../controllers/UserController";
import UserService from "../services/UserService";
import { dataSource } from "../utils/database/data-source"; // Import your DataSource
import { User } from "../models/User";

export function UserRoutes(fastify: FastifyInstance, opts: any, done: () => void) {
  
    const userRepository = dataSource.getRepository(User);
    const userService = new UserService(userRepository); 
    const userController = new UserController(userService); 

    fastify.get("/users", async (request, reply) => {
        await userController.getUsers(request, reply);
    });

    fastify.post("/user", async (request, reply) => {
        await userController.registerUser(request, reply);
    });


    // POST /api/register: Register a new user.
    // POST /api/login: Authenticate a user.
    // POST /api/verify-email: Verify user's email.

    done();
}
