import { FastifyInstance } from "fastify";
import { UserController } from "../controllers/UserController";
import { UserService } from "../services/UserService";
import { SignupSchema } from "../../schemas/SignupSchema";
import { LoginSchema } from "../../schemas/LoginSchema";
import { jwtAuthMiddleware } from "../middlewares/jwtAuthMiddleware";

/**
 * Defines routes related to user management.
 * @param {FastifyInstance} fastify - The Fastify instance.
 * @param {any} opts - Options passed to the route.
 * @param {() => void} done - Callback to indicate that the route definition is complete.
 */
export function UserRoutes(fastify: FastifyInstance, opts: any, done: () => void) {
  
    const userService = new UserService(); 
    const userController = new UserController(userService); 

    // Register a new user.
    /**
     * Route to register a new user.
     * @param {FastifyInstance} request - The request object.
     * @param {FastifyInstance} reply - The reply object.
     */
    fastify.post("/register", { schema: SignupSchema },  async (request, reply) => {
        return await userController.registerUser(request, reply, fastify);
    });

    // Verify user's email.
    /**
     * Route to verify user's email.
     * @param {FastifyInstance} request - The request object.
     * @param {FastifyInstance} reply - The reply object.
     */
    fastify.get("/verify-email", async (request, reply) => {
        await userController.verifyEmail(request, reply, fastify);
    });

    // Authenticate a user.
    /**
     * Route to authenticate a user.
     * @param {FastifyInstance} request - The request object.
     * @param {FastifyInstance} reply - The reply object.
     */
    fastify.post("/login", {schema: LoginSchema }, async (request, reply) => {
        return await userController.authenticateUser(request, reply, fastify);
    });
    
    // Get details of recipients for transfers.
    /**
     * Route to get details of recipients for transfers.
     * @param {FastifyInstance} request - The request object.
     * @param {FastifyInstance} reply - The reply object.
     */
    fastify.get('/getUserDetails', { preHandler: [jwtAuthMiddleware] }, async (request, reply) => {
        return await userController.getUser(request, reply);
    });

    done();
}
