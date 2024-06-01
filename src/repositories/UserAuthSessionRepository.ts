import { dataSource } from '../utils/database/DataSource';
import { Repository } from 'typeorm';
import { UserAuthSession } from '../models/UserAuthSession';

export class UserAuthSessionRepository{
    private userAuthSessionRepository: Repository<UserAuthSession>;

    constructor(){
        this.userAuthSessionRepository = dataSource.getRepository(UserAuthSession);
    }

    public async saveUserAuthSession(record: Partial<UserAuthSession>): Promise<UserAuthSession> {        
        const rec = await this.userAuthSessionRepository.create(record);
        return await this.userAuthSessionRepository.save(rec);
    }
    
    public async findUserAuthSession(where: Partial<UserAuthSession>): Promise<UserAuthSession | undefined> {
        return await this.userAuthSessionRepository.findOne({
          where: {
            delStatus: false,
            ...where
          }
        });
    }
    
    public async updateUserAuthSession(where: Partial<UserAuthSession>, data: Partial<UserAuthSession>): Promise<UserAuthSession | undefined> {
        await this.userAuthSessionRepository.update(where, data);
        return await this.userAuthSessionRepository.findOne({ where });
    }
    
    public async updateUserAuthSessionOnly(where: Partial<UserAuthSession>, data: Partial<UserAuthSession>): Promise<boolean> {
        const update = await this.userAuthSessionRepository.update(where, data);
        return update.affected > 0;
    }

}
