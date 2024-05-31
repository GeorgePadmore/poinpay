import { dataSource } from '../utils/database/DataSource';
import { Repository } from 'typeorm';
import { WalletTransaction } from '../models/WalletTransaction';

export class WalletTransactionRepository{
    private walletTransactionRepository: Repository<WalletTransaction>;

    constructor(){
        this.walletTransactionRepository = dataSource.getRepository(WalletTransaction);
    }

    async saveUserWalletTransaction(record: Partial<WalletTransaction>): Promise<WalletTransaction> {        
        const rec = await this.walletTransactionRepository.create(record);
        return await this.walletTransactionRepository.save(rec);
    }
    
    async findUserWalletTransaction(where: Partial<WalletTransaction>): Promise<WalletTransaction | undefined> {
        return await this.walletTransactionRepository.findOne({ where });
    }
    
    async updateUserWalletTransaction(where: Partial<WalletTransaction>, data: Partial<WalletTransaction>): Promise<WalletTransaction | undefined> {
        await this.walletTransactionRepository.update(where, data);
        return await this.walletTransactionRepository.findOne({ where });
    }
    
    async updateUserWalletTransactionOnly(where: Partial<WalletTransaction>, data: Partial<WalletTransaction>): Promise<boolean> {
        const update = await this.walletTransactionRepository.update(where, data);
        return update.affected > 0;
    }

}
