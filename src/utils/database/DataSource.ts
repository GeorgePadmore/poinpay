import { DataSource } from "typeorm";
import { normalizePort } from "../util"; // Adjust this import if normalizePort is in the same directory or higher
import * as dotenv from 'dotenv';
import { ActivityTrail } from "../../models/ActivityTrail";
import { AuthRequest } from "../../models/AuthRequest";
import { Notifications } from "../../models/Notification";
import { Transaction } from "../../models/Transaction";
import { TransactionFee } from "../../models/TransactionFee";
import { User } from "../../models/User";
import { UserAuthSession } from "../../models/UserAuthSession";
import { Wallet } from "../../models/Wallet";
import { WalletTransaction } from "../../models/WalletTransaction";

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
    entities: [ ActivityTrail, AuthRequest, Notifications, Transaction, TransactionFee, User, UserAuthSession, Wallet, WalletTransaction ],
    migrations: ['dist/database/migrations/*.js'],
    synchronize: !isProduction, // Disable synchronize in production
    ssl: isProduction,
    poolSize: 10
});

dataSource.initialize()
  .then(() => {
    console.log("Database has been initialized!");
  })
  .catch((err) => {
    console.error("Error during Database initialization:", err);
  });
