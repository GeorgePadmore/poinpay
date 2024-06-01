import { dataSource } from '../utils/database/DataSource';
import { Repository } from 'typeorm';
import { Wallet } from '../models/Wallet';

export class WalletRepository {
    private walletRepository: Repository<Wallet>;

    constructor() {
        this.walletRepository = dataSource.getRepository(Wallet);
    }

    public createWalletEntity(record: Partial<Wallet>): Wallet {
        return this.walletRepository.create(record);
    }

    public async saveUserWallet(record: Wallet): Promise<Wallet> {
        return await this.walletRepository.save(record);
    }

    public async findUserWalletByUserId(userId: number): Promise<Wallet | undefined> {
        return await this.walletRepository.findOne({
            where: {
                user: { id: userId },
                activeStatus: true,
                delStatus: false,
            }
        });
    }

    public async updateUserWalletById(userId: number, data: Partial<Wallet>): Promise<Wallet | undefined> {
        await this.walletRepository.update({ 
                user: { id: userId },
                activeStatus: true,
                delStatus: false,
         }, data);
        return await this.walletRepository.findOne({ 
            where: {
            user: { id: userId },
            activeStatus: true,
            delStatus: false,
        } });
    }

    public async updateUserWalletOnly(where: Partial<Wallet>, data: Partial<Wallet>): Promise<boolean> {
        const update = await this.walletRepository.update(where, data);
        return update.affected > 0;
    }
}
