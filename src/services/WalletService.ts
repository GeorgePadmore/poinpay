import { User } from '../models/User';
import { WalletTransaction } from '../models/WalletTransaction';
import { WalletRepository } from '../repositories/WalletRepository';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { WalletTransactionRepository } from '../repositories/WalletTransactionRepository';
import { RECORD_NOT_FOUND, SUCCESS, ACCOUNT_TOPUP_SUCCESS, ACCOUNT_TOPUP_FAILED, TRANSACTION_HISTORY_FOUND, TRANSACTION_COMPLETE, TRANSACTION_FAILED, DUPLICATE_TRANSACTION, INSUFFICIENT_BALANCE, RECIPIENT_NOT_FOUND } from '../utils/Constant';
import { UserService } from './UserService';
import { WalletTransType, currentDateTime } from '../utils/util';
import { dataSource } from '../utils/database/DataSource';
import { Wallet } from '../models/Wallet';
import { Transaction } from '../models/Transaction';
import { NotificationService } from './NotificationService';

/**
 * Service class to handle wallet-related operations.
 */
export class WalletService {

    private readonly walletRepository: WalletRepository;
    private readonly walletTransactionRepository: WalletTransactionRepository;
    private readonly transactionRepository: TransactionRepository;
    private userService: UserService | undefined;
    private notificationService: NotificationService | undefined;

    /**
     * Constructor to initialize the WalletService.
     */
    constructor() {
        this.walletTransactionRepository = new WalletTransactionRepository();
        this.walletRepository = new WalletRepository();
        this.transactionRepository = new TransactionRepository();
    }

    /**
     * Sets the UserService dependency for the WalletService.
     * @param {UserService} userService - The UserService instance to be set.
     */
    public setUserService(userService: UserService) {
        this.userService = userService;
    }

    
    /**
     * Sets the NotificationService dependency for the WalletService.
     * @param {NotificationService} notificationService - The NotificationService instance to be set.
     */
    public setNotificationService(notificationService: NotificationService) {
        this.notificationService = notificationService;
    }


    /**
     * Checks if a wallet exists for a user.
     * @param {Object} data - The data object containing the user ID.
     * @param {number} data.userId - The ID of the user.
     * @returns {Promise<boolean>} A promise representing whether the wallet exists or not.
     */
    public async isUserWalletExists(data: { userId: number }): Promise<boolean> {
        const { userId } = data;
        const wallet = await this.walletRepository.findUserWalletByUserId(userId);
        return (wallet) ? true : false;
    }


    /**
     * Creates a wallet for a user.
     * @param {Object} data - The data object containing the user object.
     * @param {User} data.user - The user for whom the wallet is created.
     * @returns {Promise<boolean>} A promise representing the success or failure of wallet creation.
     */
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


    /**
     * Retrieves the balance of a user's wallet.
     * @param {Object} data - The data object containing the user ID.
     * @param {number} data.userId - The ID of the user.
     * @returns {Promise<{responseCode: string, responseDesc: string, responseData?: { balance: number, currency: string }}>} A promise representing the balance response.
     */
    public async getUserBalance(data: { userId: number }): Promise<{ responseCode: string, responseDesc: string, responseData?: { balance: number, currency: string } }> {
        if (!this.userService) throw new Error("UserService not set");

        const { userId } = data;
        const wallet = await this.walletRepository.findUserWalletByUserId(userId);
        if (wallet) {
            return { ...SUCCESS, responseData: { balance: Number(wallet.netBal), currency: wallet.currency } };
        }

        return RECORD_NOT_FOUND;
    }



    /**
     * Tops up the balance of a user's wallet.
     * @param {Object} data - The data object containing the user ID and amount to be topped up.
     * @param {number} data.userId - The ID of the user.
     * @param {number} data.amount - The amount to be topped up.
     * @returns {Promise<{responseCode: string, responseDesc: string, responseData?: { balance: number, currency: string }}>} A promise representing the top-up response.
     */
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


    /**
     * Transfers money from one user's wallet to another.
     * @param {Object} data - The data object containing sender ID, recipient ID, idempotency key, and amount.
     * @param {number} data.senderId - The ID of the sender.
     * @param {string} data.idempotencyKey - The idempotency key for the transaction.
     * @param {number} data.recipientId - The ID of the recipient.
     * @param {number} data.amount - The amount to be transferred.
     * @returns {Promise<string>} A promise representing the result of the transfer operation.
     */
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

            const senderMessage = `Your transfer of ${debitResult.data.currency} ${amount} has been sent to ${recipientDetails.data.name} successfully.<br>${debitResult.data.currency} ${amount} was deducted.<br>Your PoinPay Balance: ${senderWallet.currency} ${debitResult.data.balance} .<br><br>Time: ${currentDateTime()}<br>TransactionId: ${transactionId}`;
            const receiverMessage = `You have received ${creditResult.data.currency} ${amount} from ${senderDetails.data.name}.<br>Your PoinPay Balance: ${creditResult.data.currency} ${creditResult.data.balance}.<br><br>Time: ${currentDateTime()}<br>TransactionId: ${transactionId}`;

            // send notifications
            this.notificationService.processNotification({userId: senderId, message: senderMessage, email: senderDetails.data.email, subject: "Funds Transfer"});
            this.notificationService.processNotification({userId: recipientId, message: receiverMessage, email: recipientDetails.data.email, subject: "Funds Received"});

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


    /**
     * Adjusts the balance of a user's wallet based on a given transaction.
     * @param {Object} data - The data object containing user details, transaction amount, ID, and type.
     * @param {User} data.user - The user for whom the wallet balance is adjusted.
     * @param {number} data.amount - The amount by which the wallet balance is adjusted.
     * @param {string} data.transactionId - The ID of the transaction.
     * @param {WalletTransType} data.transType - The type of transaction.
     * @returns {Promise<{ status: boolean, data?: { balance: number, currency: string } }>} A promise representing the result of the adjustment operation.
     */
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


    /**
     * Retrieves the transaction history for a specific user.
     * @param {Object} data - The data object containing the user ID, page number, and limit.
     * @param {number} data.userId - The ID of the user for whom the transaction history is retrieved.
     * @param {number} [data.page] - The page number for pagination (optional).
     * @param {number} [data.limit] - The limit of transactions per page (optional).
     * @returns {Promise<{responseCode: string, responseDesc: string, data?: WalletTransaction[], totalNumberOfRecords?: number, pageSize?: number, currentPage?: number }>} A promise representing the result of the transaction history retrieval.
     */
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


    /**
     * Processes the transaction type operation to calculate the new gross balance and new net balance.
     * @param {Object} data - The data object containing the transaction type, gross balance, net balance, and amount.
     * @param {WalletTransType} data.transType - The type of transaction.
     * @param {number} data.grossBal - The current gross balance.
     * @param {number} data.netBal - The current net balance.
     * @param {number} data.amount - The transaction amount.
     * @returns {Object} An object containing the new gross balance and new net balance.
     */
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



    /**
     * Checks if a transaction with the given idempotency key already exists.
     * @param {string} idempotencyKey - The idempotency key to check.
     * @returns {Promise<boolean>} A boolean indicating whether a transaction with the key exists.
     */
    private async checkIdempotencyExists(idempotencyKey: string): Promise<boolean> {
        const IdempotencyExists = await this.transactionRepository.findTransactionDetails({ idempotencyKey });
        return (IdempotencyExists) ? true : false;
    }


    /**
     * Generates a random transaction ID of the specified length.
     * @param {number} [codeLength=12] - The length of the generated transaction ID.
     * @returns {Promise<string>} The generated transaction ID.
     */
    private async generateTransactionId(codeLength = 12): Promise<string> {
        let code;
        do {
            code = Array.from({ length: codeLength }, () => Math.floor(Math.random() * 10)).join('');
        } while (await this.walletTransactionRepository.findUserWalletTransaction({ transactionId: code }));
        return code;
    }

    /**
     * Generates a transaction ID for transfer transactions.
     * @returns {Promise<string>} The generated transaction ID for transfer transactions.
     */
    private async generateTransferTransactionId(): Promise<string> {
        return await this.generateTransactionId();
    }
}
