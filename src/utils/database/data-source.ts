import { DataSource } from "typeorm";
import { User } from "../../models/User"; // Import your User entity
import { normalizePort } from "../util";
import * as dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

export const dataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: normalizePort(process.env.DB_PORT), // Convert to number
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    logging: !isProduction,
    entities: [User],
    migrations: ['dist/database/migrations/*.js'],
    synchronize: !isProduction, // Disable synchronize in production
    ssl: isProduction,
});

dataSource.initialize()
  .then(() => {
    console.log("Database has been initialized!");
  })
  .catch((err) => {
    console.error("Error during Database initialization:", err);
  });
