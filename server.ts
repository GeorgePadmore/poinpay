import 'reflect-metadata';
import { fastify } from 'fastify';
import fastifyJWT from '@fastify/jwt';
import cors from '@fastify/cors';
import { dataSource } from './src/utils/database/DataSource';
import { jwtConfig } from "./src/utils/JwtConfig";
import { UserRoutes } from "./src/routes/UserRoute";
import { WalletRoutes } from './src/routes/WalletRoute';

const server = fastify({ logger: true });

server.register(cors, { origin: true });

server.register(require('fastify-typeorm-plugin'), {
    connection: dataSource.options
});

server.register(fastifyJWT, jwtConfig);


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

