import { dataSource } from '../utils/database/DataSource';
import { User } from '../models/User';
import { Repository } from 'typeorm';

export class UserRepository{
    private userRepository: Repository<User>;

    constructor(){
        this.userRepository = dataSource.getRepository(User);
    }

    public async saveUser(user: Partial<User>): Promise<User> {
        const userRec = this.userRepository.create(user);
        return await this.userRepository.save(userRec);
    }
    
    public async findUser(where: Partial<User>): Promise<User | undefined> {
        return await this.userRepository.findOne({
          where: {
            delStatus: false,
            ...where
          }
        });
    }

    public async findUserInfo(where: Partial<User>): Promise<User | undefined> {
        return await this.userRepository.findOne({
          where: {
            delStatus: false,
            ...where
          },
          select: ["id", "name"]
        });
    }
    
    public async updateUser(where: Partial<User>, data: Partial<User>): Promise<User | undefined> {
        await this.userRepository.update(where, data);
        return await this.userRepository.findOne({ where });
    }
    
    public async updateUserOnly(where: Partial<User>, data: Partial<User>): Promise<boolean> {
        const update = await this.userRepository.update(where, data);
        return update.affected > 0;
    }

    // public async findUserByEmail(email: string): Promise<User | undefined> {
    //     return await this.findOne({ where: { email } });
    // }

    // public async findAllUsers(where: Partial<User>): Promise<User[]> {
    //     return await this.find({ where });
    // }
}
