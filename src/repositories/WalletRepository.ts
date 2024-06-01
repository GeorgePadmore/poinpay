import { dataSource } from '../utils/database/DataSource';
import { Repository } from 'typeorm';
import { Wallet } from '../models/Wallet';

export class WalletRepository{
    private walletRepository: Repository<Wallet>;

    constructor(){
        this.walletRepository = dataSource.getRepository(Wallet);
    }

    public async saveUserWallet(record: Partial<Wallet>): Promise<Wallet> {        
        const rec = await this.walletRepository.create(record);
        return await this.walletRepository.save(rec);
    }
    
    public async findUserWallet(where: Partial<Wallet>): Promise<Wallet | undefined> {
        return await this.walletRepository.findOne({
          where: {
            delStatus: false,
            ...where
          }
        });
    }
    
    public async updateUserWallet(where: Partial<Wallet>, data: Partial<Wallet>): Promise<Wallet | undefined> {
        await this.walletRepository.update(where, data);
        return await this.walletRepository.findOne({ where });
    }
    
    public async updateUserWalletOnly(where: Partial<Wallet>, data: Partial<Wallet>): Promise<boolean> {
        const update = await this.walletRepository.update(where, data);
        return update.affected > 0;
    }

}
