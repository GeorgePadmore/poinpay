import { FindManyOptions, Repository } from 'typeorm';
import { WalletTransaction } from '../models/WalletTransaction';
import { dataSource } from '../utils/database/DataSource';
import { processPagination } from '../utils/util';


export class WalletTransactionRepository {
    private walletTransactionRepository: Repository<WalletTransaction>;

    constructor() {
        this.walletTransactionRepository = dataSource.getRepository(WalletTransaction);
    }

    public createWalletTransactionEntity(record: Partial<WalletTransaction>): WalletTransaction {
        return this.walletTransactionRepository.create(record);
    }

    public async saveUserWalletTransaction(record: WalletTransaction): Promise<WalletTransaction> {
        return await this.walletTransactionRepository.save(record);
    }

    public async findUserWalletTransaction(where: Partial<WalletTransaction>): Promise<WalletTransaction | undefined> {
        return await this.walletTransactionRepository.findOne({ where });
    }


    public async findUserWalletTransactionsByUserId(data: {userId: number, page?: number, limit?: number}): Promise<{ transactions: WalletTransaction[], count: number } | undefined> {
        const { userId } = data;
        const {limit, page} = processPagination({page: data.page, limit: data.limit});

        const queryBuilder = await this.walletTransactionRepository
        .createQueryBuilder('wallet_transactions')
        .select([
            'wallet_transactions.id AS Id',
            'wallet_transactions.transaction_id AS transactionId',
            'wallet_transactions.amount as amount',
            'wallet_transactions.net_bal_bef as netBalBef',
            'wallet_transactions.net_bal_aft as netBalAft',
            `(CASE WHEN wallet_transactions.trans_type = 'AO' THEN 'Account Opening' WHEN wallet_transactions.trans_type = 'DP' THEN 'Deposit' WHEN wallet_transactions.trans_type = 'OT' THEN 'Outbound Funds Transfer' ELSE 'Funds Received' END) AS transactionType`,
            'wallet_transactions.status as status',
            'wallet_transactions.created_at as createdAt'
        ])
        .where({ user: {id: userId}, status: true })

        queryBuilder.orderBy('wallet_transactions.createdAt', 'DESC');
    
        const count = await queryBuilder.getCount();
        const transactions = await queryBuilder.offset((page - 1) * limit).limit(limit).getRawMany();

        return { transactions, count };
    }


    public async updateUserWalletTransaction(where: Partial<WalletTransaction>, data: Partial<WalletTransaction>): Promise<WalletTransaction | undefined> {
        await this.walletTransactionRepository.update(where, data);
        return await this.walletTransactionRepository.findOne({ where });
    }

    public async updateUserWalletTransactionOnly(where: Partial<WalletTransaction>, data: Partial<WalletTransaction>): Promise<boolean> {
        const update = await this.walletTransactionRepository.update(where, data);
        return update.affected > 0;
    }
}
