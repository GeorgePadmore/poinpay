import { EntityRepository, Repository } from 'typeorm';
import { dataSource } from '../utils/database/DataSource';
import { User } from '../models/User';

// @EntityRepository(User)
export class UserRepository{
// export class UserRepository extends Repository<User> {

    // constructor(private readonly userRepository: UserRepository) {}

    // const userRepository = dataSource.getRepository(User);

    async saveUser(user: Partial<User>): Promise<User> {
        const userRepository = dataSource.getRepository(User);
        const userRec = userRepository.create(user);
        return await userRepository.save(userRec);
    }

    async findUser(where: Partial<User>): Promise<User | undefined> {
        const userRepository = dataSource.getRepository(User);
        return await userRepository.findOne({
            where: {
                delStatus: false, ...where
            }
        });
    }

    async updateUser(where: Partial<User>, data: Partial<User>): Promise<User | undefined> {
        const userRepository = dataSource.getRepository(User);
        await userRepository.update(where, data);
        return await userRepository.findOne({ where });
    }

    async updateUserOnly(where: Partial<User>, data: Partial<User>): Promise<Boolean> {
        const userRepository = dataSource.getRepository(User);
        const update = await userRepository.update(where, data);
        return (update.affected > 0) ? true : false;
    }

    // async findUserByEmail(email: string): Promise<User | undefined> {
    //     return await this.findOne({ where: { email } });
    // }

    // async findAllUsers(where: Partial<User>): Promise<User[]> {
    //     return await this.find({ where });
    // }
}
