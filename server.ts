import 'reflect-metadata';
import { fastify, FastifyError, FastifyInstance } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import fastifyJWT from '@fastify/jwt';
// import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import { dataSource } from './src/utils/database/DataSource';
import { jwtConfig } from "./src/utils/JwtConfig";
import { UserRoutes } from "./src/routes/UserRoute";
import { WalletRoutes } from './src/routes/WalletRoute';

const server = fastify({ logger: true });

// server.register(helmet);
// server.register(
//     helmet,
//     // Example disables the `contentSecurityPolicy` middleware but keeps the rest.
//     { contentSecurityPolicy: false }
// )
server.register(cors, { origin: true });

server.register(require('fastify-typeorm-plugin'), {
    connection: dataSource.options
});

server.register(fastifyJWT, jwtConfig);


//TODO: Not working
// server.addHook('onError', (request, reply, error: FastifyError, done) => {
//     // console.log(error);
    
//     if (error.validation) {
//       // Modify the error response for validation errors
//       reply.code(400).send({
//         statusCode: 400,
//         error: 'Bad Request',
//         message: 'Validation Error',
//         details: error.validation,
//       });
//     } else {
//       // Pass other errors to the default handler
//       done();
//     }
//   });
  

// Routes
server.register(UserRoutes, { prefix: '/api' });
server.register(WalletRoutes, { prefix: '/api' });

const start = async () => {
  try {
    await server.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server running on port 3000');
  } catch (err) {
    server.log.error(err)
    process.exit(1);
  }
};

start();

