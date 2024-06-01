import { WalletTransType } from '../utils/util';
import { User } from '../models/User';
import { WalletTransaction } from '../models/WalletTransaction';
import { WalletRepository } from '../repositories/WalletRepository';
import { WalletTransactionRepository } from '../repositories/WalletTransactionRepository';
import { RECORD_NOT_FOUND, SUCCESS, ACCOUNT_TOPUP_SUCCESS, ACCOUNT_TOPUP_FAILED, TRANSACTION_HISTORY_FOUND } from '../utils/Constant';
import { dataSource } from '../utils/database/DataSource';
import { UserService } from './UserService';

export class WalletService {

    private readonly walletRepository: WalletRepository;
    private readonly walletTransactionRepository: WalletTransactionRepository;
    private userService: UserService | undefined;

    constructor() {
        this.walletTransactionRepository = new WalletTransactionRepository();
        this.walletRepository = new WalletRepository();
    }

    // Method to set UserService
    public setUserService(userService: UserService) {
        this.userService = userService;
    }

    public async isUserWalletExists(data: { user: User }): Promise<boolean> {
        const { user } = data;
        const wallet = await this.walletRepository.findUserWalletByUserId(user.id);
        return wallet !== undefined;
    }

    public async createUserWallet(data: { user: User }): Promise<boolean> {
        try {
            const { user } = data;
            const walletExists = await this.isUserWalletExists({ user });
            if (!walletExists) {
                const transactionId = await this.generateTransactionId();
                return await this.adjustWallet({
                    user,
                    amount: 0,
                    transactionId,
                    transType: WalletTransType.InitiateWallet
                });
            }
            return false;
        } catch (error) {
            console.error(error);
            return false;
        }
    }


    public async getUserBalance(data: { userId: number }): Promise<{ responseCode: string, responseDesc: string, responseData?: { balance: number, currency: string } }> {
        if (!this.userService) throw new Error("UserService not set");

        const { userId } = data;
        const wallet = await this.walletRepository.findUserWalletByUserId(userId);
        if (wallet) {
            return { ...SUCCESS, responseData: { balance: Number(wallet.netBal), currency: wallet.currency } };
        }

        return RECORD_NOT_FOUND;
    }


    public async topUpBalance(data: { userId: number, amount: number }): Promise<{ responseCode: string, responseDesc: string, responseData?: { balance: number, currency: string } }> {
        try {
            const { userId, amount } = data;

            if (!this.userService) throw new Error("UserService not set");

            const wallet = await this.walletRepository.findUserWalletByUserId(userId);
            if (wallet) {
                const userResponse = await this.userService.getUserDetailsById(userId);
                if (userResponse.data) {
                    const transactionId = await this.generateTransactionId();
                    const topUpResult = await this.adjustWallet({
                        user: userResponse.data,
                        amount,
                        transactionId,
                        transType: WalletTransType.CreditWallet
                    });
                    if (topUpResult) {
                        return ACCOUNT_TOPUP_SUCCESS;
                    }
                    return ACCOUNT_TOPUP_FAILED;
                }
                return RECORD_NOT_FOUND;
            }
            return RECORD_NOT_FOUND;
        } catch (error) {
            console.error(error);
            return ACCOUNT_TOPUP_FAILED;
        }
    }



    public async adjustWallet(data: { user: User, amount: number, transactionId: string, transType: WalletTransType }): Promise<boolean> {
        const queryRunner = dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const { user, amount, transactionId, transType } = data;
            const wallet = await this.walletRepository.findUserWalletByUserId(user.id);
            let grossBalBef: number;
            let netBalBef: number;

            if (wallet) {
                grossBalBef = Number(wallet.grossBal);
                netBalBef = Number(wallet.netBal);
                const { newGrossBal, newNetBal } = this.processTransTypeOperation({ transType, grossBal: grossBalBef, netBal: netBalBef, amount: Number(amount) });

                wallet.grossBal = Number(newGrossBal);
                wallet.netBal = Number(newNetBal);

                await queryRunner.manager.save(wallet);
            } else {
                const { newGrossBal, newNetBal } = this.processTransTypeOperation({ transType, grossBal: 0, netBal: 0, amount: Number(amount) });

                const newWallet = this.walletRepository.createWalletEntity({ user, grossBal: Number(newGrossBal), netBal: Number(newNetBal) });
                await queryRunner.manager.save(newWallet);
            }
            
            const walletTransaction = this.walletTransactionRepository.createWalletTransactionEntity({
                transactionId,
                transType,
                amount,
                netAmount: amount,
                charge: 0,
                grossBalBef,
                grossBalAft: wallet.grossBal,
                netBalBef,
                netBalAft: wallet.netBal,
                user,
                status: true
            });
            await queryRunner.manager.save(walletTransaction);

            await queryRunner.commitTransaction();
            return true;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            console.error(error);
            return false;
        } finally {
            await queryRunner.release();
        }
    }


    //Transaction History
    public async getTransactionHistoryList(data: {userId: number, page?: number, limit?: number}): Promise<{responseCode: string, responseDesc: string, data?: WalletTransaction[], totalNumberOfRecords?: number, pageSize?: number, currentPage?: number }>{
        const { userId, page, limit } = data;

        const { transactions, count } = await this.walletTransactionRepository.findUserWalletTransactionsByUserId({userId, page, limit});
        if(count === 0){
            return RECORD_NOT_FOUND;
        }

        return {
            ...TRANSACTION_HISTORY_FOUND, 
            data: transactions, 
            totalNumberOfRecords: count, 
            pageSize: transactions.length,
            currentPage: page
        }
    }



    private processTransTypeOperation(data: { transType: WalletTransType, grossBal: number, netBal: number, amount: number }): { newGrossBal: number, newNetBal: number } {
        const { transType, grossBal, netBal, amount } = data;

        let newGrossBal = parseFloat((grossBal + amount).toFixed(2));
        let newNetBal = parseFloat((netBal + amount).toFixed(2));

        if (transType === WalletTransType.Transfer) {
            newGrossBal = parseFloat((grossBal - amount).toFixed(2));
            newNetBal = parseFloat((netBal - amount).toFixed(2));
        }

        return { newGrossBal, newNetBal };
    }



    private async generateTransactionId(codeLength = 12): Promise<string> {
        let code;
        do {
            code = Array.from({ length: codeLength }, () => Math.floor(Math.random() * 10).toString()).join('');
            const record = await this.walletTransactionRepository.findUserWalletTransaction({ transactionId: code });
            if (!record) break;
        } while (true);

        return code;
    }
}
