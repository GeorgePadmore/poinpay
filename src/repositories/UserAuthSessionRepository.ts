import { dataSource } from '../utils/database/DataSource';
import { User } from '../models/User';
import { Repository } from 'typeorm';
import { UserAuthSession } from '../models/UserAuthSession';

export class UserAuthSessionRepository{
    private userAuthSessionRepository: Repository<UserAuthSession>;

    constructor(){
        this.userAuthSessionRepository = dataSource.getRepository(UserAuthSession);
    }

    async saveUserAuthSession(record: Partial<UserAuthSession>): Promise<UserAuthSession> {        
        const rec = await this.userAuthSessionRepository.create(record);
        return await this.userAuthSessionRepository.save(rec);
    }
    
    async findUserAuthSession(where: Partial<UserAuthSession>): Promise<UserAuthSession | undefined> {
        return await this.userAuthSessionRepository.findOne({
          where: {
            delStatus: false,
            ...where
          }
        });
    }
    
    async updateUserAuthSession(where: Partial<UserAuthSession>, data: Partial<UserAuthSession>): Promise<UserAuthSession | undefined> {
        await this.userAuthSessionRepository.update(where, data);
        return await this.userAuthSessionRepository.findOne({ where });
    }
    
    async updateUserAuthSessionOnly(where: Partial<UserAuthSession>, data: Partial<UserAuthSession>): Promise<boolean> {
        const update = await this.userAuthSessionRepository.update(where, data);
        return update.affected > 0;
    }

}
