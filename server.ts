import 'reflect-metadata';
import { fastify } from 'fastify';
import { dataSource } from './src/utils/database/data-source';
import { UserRoutes } from "./src/routes/UserRoute";

const server = fastify({ logger: true });

server.register(require('fastify-typeorm-plugin'), {
    connection: dataSource.options
});



// Routes

//TODO: register user Routes
server.register(UserRoutes, { prefix: '/api' });


//TODO: register Wallet Routes
//TODO: register Transaction Routes
//TODO: register Notifications Routes


const start = async () => {
  try {
    await server.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server running on port 3000');
  } catch (err) {
    // console.error(err);
    server.log.error(err)
    process.exit(1);
  }
};

start();

