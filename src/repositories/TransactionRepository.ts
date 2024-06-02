import { dataSource } from '../utils/database/DataSource';
import { Repository } from 'typeorm';
import { Transaction } from '../models/Transaction';

export class TransactionRepository {
    private transactionRepository: Repository<Transaction>;

    constructor() {
        this.transactionRepository = dataSource.getRepository(Transaction);
    }

    public createTransactionEntity(record: Partial<Transaction>): Transaction {
        return this.transactionRepository.create(record);
    }

    public async saveTransaction(record: Transaction): Promise<Transaction> {
        return await this.transactionRepository.save(record);
    }

    public async findTransactionDetails(where: Partial<Transaction>): Promise<Transaction | undefined> {
        return await this.transactionRepository.findOne({
            where
        });
    }

    public async updateTransactionRecord(where: Partial<Transaction>, data: Partial<Transaction>): Promise<Transaction | undefined> {
        await this.transactionRepository.update(where, data);
        return await this.transactionRepository.findOne({ where });
    }

    public async updateTransactionRecordOnly(where: Partial<Transaction>, data: Partial<Transaction>): Promise<boolean> {
        const update = await this.transactionRepository.update(where, data);
        return update.affected > 0;
    }
}
