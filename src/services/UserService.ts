// import { User } from '../models/user';
import { User } from 'src/models/User';
import { UserRepository } from '../repositories/UserRepository';
import bcrypt from 'bcrypt';

class UserService {

constructor(private readonly userRepository: UserRepository) {}

  async createUser(username: string, email: string, password: string): Promise<User> {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({ username, name: "", email, password: passwordHash });
    await this.userRepository.save(user);
    return user;
  }

  async findUserByEmail(email: string): Promise<User | undefined> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async getUsers(): Promise<User[] | undefined> {
    return await this.userRepository.find();
  }

}

export default UserService;
