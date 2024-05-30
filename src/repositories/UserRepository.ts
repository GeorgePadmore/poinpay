import { dataSource } from '../utils/database/DataSource';
import { User } from '../models/User';
import { Repository } from 'typeorm';

export class UserRepository{
    private userRepository: Repository<User>;

    constructor(){
        this.userRepository = dataSource.getRepository(User);
    }

    async saveUser(user: Partial<User>): Promise<User> {
        const userRec = this.userRepository.create(user);
        return await this.userRepository.save(userRec);
    }
    
    async findUser(where: Partial<User>): Promise<User | undefined> {
        return await this.userRepository.findOne({
          where: {
            delStatus: false,
            ...where
          }
        });
    }
    
    async updateUser(where: Partial<User>, data: Partial<User>): Promise<User | undefined> {
        await this.userRepository.update(where, data);
        return await this.userRepository.findOne({ where });
    }
    
    async updateUserOnly(where: Partial<User>, data: Partial<User>): Promise<boolean> {
        const update = await this.userRepository.update(where, data);
        return update.affected > 0;
    }

    // async findUserByEmail(email: string): Promise<User | undefined> {
    //     return await this.findOne({ where: { email } });
    // }

    // async findAllUsers(where: Partial<User>): Promise<User[]> {
    //     return await this.find({ where });
    // }
}
