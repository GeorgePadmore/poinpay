import { FastifyInstance } from 'fastify';

import { User } from '../models/User';
import { WalletRepository } from '../repositories/WalletRepository';

import { WalletTransType  } from "../utils/util";
import { WalletTransactionRepository } from 'repositories/WalletTransactionRepository';
import { RECORD_NOT_FOUND, SUCCESS } from 'utils/constant';
import { dataSource } from 'utils/database/DataSource';


export class WalletService {

    private readonly walletRepository: WalletRepository;
    private readonly walletTransactionRepository: WalletTransactionRepository;


    constructor() {
        this.walletTransactionRepository = new WalletTransactionRepository();
        this.walletRepository = new WalletRepository();
    }


    /**
     * Checks if the User's Wallet exists.
     * @param data - Object containing the user.
     * @returns Promise<boolean> - True if the wallet exists, otherwise false.
    */
    async isUserWalletExists(data: {user: User}): Promise<boolean> {
        const { user } = data;
        const wallet = await this.walletRepository.findUserWallet({user, activeStatus: true});
        return (wallet) ? true: false;
    }


    /**
     * Creates a user wallet within a transaction block to ensure data consistency.
     * @param data - Object containing the user for whom the wallet is being created.
     * @returns Promise<boolean> - True if the wallet creation and transaction log succeed, otherwise false.
    */
    async createUserWallet(data: { user: User }): Promise<boolean> {
        const queryRunner = dataSource.createQueryRunner();

        try {
        await queryRunner.connect();
        await queryRunner.startTransaction();

        const { user } = data;

        // Check if the user already has a wallet
        const wallet = await this.walletRepository.findUserWallet({ user });
        if (!wallet) {
            const transactionId = await this.generateTransactionId();

            // Create user wallet
            const walletCreation = await queryRunner.manager.save(this.walletRepository.saveUserWallet({ user }));

            if (walletCreation) {
            // Create wallet transaction
            const walletTransaction = await queryRunner.manager.save(
                this.walletTransactionRepository.saveUserWalletTransaction({
                transactionId,
                transType: WalletTransType.InitiateWallet,
                status: true,
                user: user,
                })
            );

            if (walletTransaction) {
                // Commit the transaction
                await queryRunner.commitTransaction();
                return true;
            }
            }

            // If wallet creation or wallet transaction creation fails, rollback the transaction
            await queryRunner.rollbackTransaction();
            return false;
        }

        // If the user already has a wallet, return false
        return false;

        } catch (error) {
        // Rollback the transaction in case of error
        await queryRunner.rollbackTransaction();
        console.error(error);
        return false;
        } finally {
        // Release the query runner
        await queryRunner.release();
        }
    }



    /**
     * Gets a user wallet balance.
     * @param data - Object containing the user for whom the wallet is being searched.
     * @returns Promise<{responseCode: string, responseDesc: string, balance?: number, currency?: string}> - Balance response if the wallet exists, else RECORD_NOT_FOUND response if the wallet is empty.
    */
    async getUserBalance(data: {user: User}): Promise<{responseCode: string, responseDesc: string, balance?: number, currency?: string}>{
        const { user } = data;

        const wallet = await this.walletRepository.findUserWallet({user, activeStatus: true});
        if(wallet){
            return {...SUCCESS, balance: Number(wallet.netBal), currency: wallet.currency}
        }
        return RECORD_NOT_FOUND;
    }





  async getTransactionHistory(data: {user: User}) {
    const { user } = data;

    //I need to be sure whether to fetch from wallet Transaction or transaction table.
    // wallet Transaction shows wallet creation history, account top ups and transfers.

    //You can later on get the detailed transaction when you search the transId.
    // await this.wall
  }




    /**
    * Generates a unique transaction ID.
    * @returns Promise<string> - The generated transaction ID.
    */
    async generateTransactionId(codeLength = 12): Promise<string> {
        let code = '';
  
        do {
            for (let i = 0; i < codeLength; i++) {
                const randomDigit = Math.floor(Math.random() * 10);
                code += randomDigit.toString();
            }
  
            const record = await this.walletTransactionRepository.findUserWalletTransaction({transactionId: code});
            // If record is null or undefined, it means the code doesn't exist yet, so we can exit the loop
            if (!record) {
                break;
            }
            code = ''; // Reset the code and generate a new one
        } while (true);
  
        return code;
    }
  



}