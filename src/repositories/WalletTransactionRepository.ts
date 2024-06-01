import { dataSource } from '../utils/database/DataSource';
import { Repository } from 'typeorm';
import { WalletTransaction } from '../models/WalletTransaction';

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

    public async updateUserWalletTransaction(where: Partial<WalletTransaction>, data: Partial<WalletTransaction>): Promise<WalletTransaction | undefined> {
        await this.walletTransactionRepository.update(where, data);
        return await this.walletTransactionRepository.findOne({ where });
    }

    public async updateUserWalletTransactionOnly(where: Partial<WalletTransaction>, data: Partial<WalletTransaction>): Promise<boolean> {
        const update = await this.walletTransactionRepository.update(where, data);
        return update.affected > 0;
    }
}
