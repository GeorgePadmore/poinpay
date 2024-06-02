import { User } from '../models/User';
import { WalletTransaction } from '../models/WalletTransaction';
import { WalletRepository } from '../repositories/WalletRepository';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { WalletTransactionRepository } from '../repositories/WalletTransactionRepository';
import { NotificationsRepository } from '../repositories/NotificationRepository';
import { RECORD_NOT_FOUND, SUCCESS, ACCOUNT_TOPUP_SUCCESS, ACCOUNT_TOPUP_FAILED, TRANSACTION_HISTORY_FOUND, TRANSACTION_COMPLETE, TRANSACTION_FAILED, DUPLICATE_TRANSACTION, INSUFFICIENT_BALANCE, RECIPIENT_NOT_FOUND } from '../utils/Constant';
import { UserService } from './UserService';
import { WalletTransType, currentDateTime } from '../utils/util';
import { dataSource } from '../utils/database/DataSource';
import { Wallet } from '../models/Wallet';
import { Transaction } from '../models/Transaction';

export class WalletService {

    private readonly walletRepository: WalletRepository;
    private readonly walletTransactionRepository: WalletTransactionRepository;
    private readonly transactionRepository: TransactionRepository;
    private readonly notificationsRepository: NotificationsRepository;
    private userService: UserService | undefined;

    constructor() {
        this.walletTransactionRepository = new WalletTransactionRepository();
        this.walletRepository = new WalletRepository();
        this.transactionRepository = new TransactionRepository();
        this.notificationsRepository = new NotificationsRepository();
    }

    // Method to set UserService
    public setUserService(userService: UserService) {
        this.userService = userService;
    }

    public async isUserWalletExists(data: { userId: number }): Promise<boolean> {
        const { userId } = data;
        const wallet = await this.walletRepository.findUserWalletByUserId(userId);
        return (wallet) ? true : false;
    }

    public async createUserWallet(data: { user: User }): Promise<boolean> {
        try {
            const { user } = data;
            const walletExists = await this.isUserWalletExists({ userId: user.id });
            if (!walletExists) {
                const transactionId = await this.generateTransactionId();
                const wallet = await this.adjustWallet({
                    user,
                    amount: 0,
                    transactionId,
                    transType: WalletTransType.InitiateWallet
                });
                return wallet.status;
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

    public async transferMoney(data: { senderId: number, idempotencyKey: string, recipientId: number, amount: number }) {
        const queryRunner = dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const { senderId, idempotencyKey, recipientId, amount } = data;

            // Check if idempotency key already exists
            if (await this.checkIdempotencyExists(idempotencyKey)) {
                return DUPLICATE_TRANSACTION;
            }

            // Check if both sender and recipient wallets exist
            const [senderWallet, recipientWallet] = await Promise.all([
                this.walletRepository.findUserWalletByUserId(senderId),
                this.walletRepository.findUserWalletByUserId(recipientId)
            ]);

            if (!senderWallet) return RECORD_NOT_FOUND;
            if (!recipientWallet) return RECIPIENT_NOT_FOUND;


            const [senderDetails, recipientDetails] = await Promise.all([
                this.userService.getUserDetailsById(senderId),
                this.userService.getUserDetailsById(recipientId)
            ]);

            if (!senderDetails.data) return RECORD_NOT_FOUND;
            if (!recipientDetails.data) return RECIPIENT_NOT_FOUND;


            // Ensure sender has sufficient funds
            if (Number(amount) > Number(senderWallet.netBal)) {
                return INSUFFICIENT_BALANCE;
            }

            // Create and save transaction record
            const transactionId = await this.generateTransferTransactionId();
            const transactionRecord = this.transactionRepository.createTransactionEntity({
                transactionId,
                sender: { id: senderId } as User,
                recipient: { id: recipientId } as User,
                amount,
                charge: 0,
                idempotencyKey,
                transType: WalletTransType.Transfer,
                src: "API"
            });
            await queryRunner.manager.save(transactionRecord);

            // Adjust sender's and recipient's wallets
            const [debitResult, creditResult] = await Promise.all([
                this.adjustWallet({
                    user: { id: senderId } as User,
                    amount,
                    transactionId,
                    transType: WalletTransType.Transfer
                }),
                this.adjustWallet({
                    user: { id: recipientId } as User,
                    amount,
                    transactionId,
                    transType: WalletTransType.Receive
                })
            ]);

            if (!debitResult.status || !creditResult.status) {
                throw new Error('Transaction adjustment failed');
            }

            // Update transaction status to complete
            await queryRunner.manager.getRepository(Transaction).update({ transactionId }, { status: true });

            const senderMessage = `Your transfer of ${debitResult.data.currency} ${amount} has been sent to ${recipientDetails.data.name} successfully.\n${debitResult.data.currency} ${amount} was deducted.\nYour PoinPay Balance: ${senderWallet.currency} ${debitResult.data.balance} .\nTime: ${currentDateTime()}\nTransactionId: ${transactionId}`;
            const receiverMessage = `You have received ${creditResult.data.currency} ${amount} from ${senderDetails.data.name}.\nYour PoinPay Balance: ${creditResult.data.currency} ${creditResult.data.balance}.\nTime: ${currentDateTime()}\nTransactionId: ${transactionId}`;

            // Create and save notifications
            await Promise.all([
                this.notificationsRepository.createTransactionEntity({
                    user: { id: senderId } as User,
                    message: senderMessage,
                    status: "S",
                    read: false,
                }),
                this.notificationsRepository.createTransactionEntity({
                    user: { id: recipientId } as User,
                    message: receiverMessage,
                    status: "S",
                    read: false,
                })
            ].map(notification => queryRunner.manager.save(notification)));

            await queryRunner.commitTransaction();
            return TRANSACTION_COMPLETE;

        } catch (error) {
            await queryRunner.rollbackTransaction();
            console.error(error);
            return TRANSACTION_FAILED;
        } finally {
            await queryRunner.release();
        }
    }

    public async adjustWallet(data: { user: User, amount: number, transactionId: string, transType: WalletTransType }): Promise<{ status: boolean, data?: { balance: number, currency: string } }> {
        const queryRunner = dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const { user, amount, transactionId, transType } = data;
            let wallet: Wallet;
            wallet = await this.walletRepository.findUserWalletByUserId(user.id);
            let grossBalBef: number;
            let netBalBef: number;

            if (wallet) {
                //update wallet
                grossBalBef = Number(wallet.grossBal);
                netBalBef = Number(wallet.netBal);
                const { newGrossBal, newNetBal } = this.processTransTypeOperation({ transType, grossBal: grossBalBef, netBal: netBalBef, amount: Number(amount) });

                wallet.grossBal = Number(newGrossBal);
                wallet.netBal = Number(newNetBal);

                await queryRunner.manager.save(wallet);
            }else{
                const { newGrossBal, newNetBal } = this.processTransTypeOperation({ transType, grossBal: 0, netBal: 0, amount: Number(amount) });

                wallet = this.walletRepository.createWalletEntity({ user, grossBal: Number(newGrossBal), netBal: Number(newNetBal) });
                await queryRunner.manager.save(wallet);
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
            return { status: true, data: { balance: wallet.netBal, currency: wallet.currency } };

        } catch (error) {
            await queryRunner.rollbackTransaction();
            console.error(error);
            return { status: false };
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



    private async checkIdempotencyExists(idempotencyKey: string): Promise<boolean> {
        const IdempotencyExists = await this.transactionRepository.findTransactionDetails({ idempotencyKey });
        return (IdempotencyExists) ? true : false;
    }

    private async generateTransactionId(codeLength = 12): Promise<string> {
        let code;
        do {
            code = Array.from({ length: codeLength }, () => Math.floor(Math.random() * 10)).join('');
        } while (await this.walletTransactionRepository.findUserWalletTransaction({ transactionId: code }));
        return code;
    }

    private async generateTransferTransactionId(): Promise<string> {
        return await this.generateTransactionId();
    }
}
