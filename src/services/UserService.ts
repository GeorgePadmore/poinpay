import { UserRepository } from '../repositories/UserRepository';
import { UserAuthSessionRepository } from '../repositories/UserAuthSessionRepository';
import { WalletRepository } from '../repositories/WalletRepository';
import { hashString, verifyHashedString, currentDateTime } from "../utils/util";
import { sendVerificationEmail } from '../utils/EmailService';
import { SUCCESS, FAILURE, USER_CREATION_FAILED, USER_CREATION_SUCCESS, USERNAME_EXISTS, EMAIL_EXISTS, RECORD_NOT_FOUND, EMAIL_ALREADY_VERIFIED, EMAIL_VERIFY_FAILED, EMAIL_VERIFY_SUCCESS, INVALID_VERIFY_TOKEN, ACCOUNT_UNVERIFIED, WRONG_LOGIN_CREDENTIALS, LOGIN_SUCCESS, LOGIN_FAILED } from "../utils/Constant";
import { WalletService } from './WalletService';
import { FastifyInstance } from 'fastify';
import { User } from '../models/User';
import { dataSource } from '../utils/database/DataSource';


export class UserService {

  private readonly userRepository: UserRepository;
  private readonly userAuthSessionRepository: UserAuthSessionRepository;
  private readonly walletRepository: WalletRepository;
  private walletService: WalletService | undefined;

  constructor() {
    this.userRepository = new UserRepository();
    this.userAuthSessionRepository = new UserAuthSessionRepository();
    this.walletRepository = new WalletRepository();
  }

  public setWalletService(walletService: WalletService) {
    this.walletService = walletService;
  }

  public async registerUser(data: {name: string, username: string, email: string, password: string}, fastify: FastifyInstance): Promise<{responseCode: string, responseDesc: string}> {
    try {
      const { name, username, email, password } = data;
      const existingUserByUsername = await this.userRepository.findUser({ username });
      if (existingUserByUsername) return USERNAME_EXISTS;
      const existingUserByEmail = await this.userRepository.findUser({ email });
      if (existingUserByEmail) return EMAIL_EXISTS;

      const passwordHash = await hashString(password);
      const userData = { ...data, password: passwordHash, emailVerified: false };
      const user = await this.userRepository.saveUser(userData);

      const verificationToken = this.generateEmailVerificationToken(user, fastify);
      await sendVerificationEmail(user.email, verificationToken);

      return USER_CREATION_SUCCESS;
    } catch (error) {
      console.error(error);
      return USER_CREATION_FAILED;
    }
  }

  private generateEmailVerificationToken(user: User, fastify: FastifyInstance): string {
    const payload = { userId: user.id, email: user.email };
    const options = { expiresIn: '1h' };
    return fastify.jwt.sign(payload, options);
  }

  public async verifyEmail(token: string, fastify: FastifyInstance): Promise<{responseCode: string, responseDesc: string}> {
    const queryRunner = dataSource.createQueryRunner();

    try {

      if (!this.walletService) throw new Error("WalletService not set");

      await queryRunner.connect();
      await queryRunner.startTransaction();
      
      const decoded = fastify.jwt.verify(token) as { userId: number; email: string };
      const user = await this.userRepository.findUser({ id: decoded.userId, email: decoded.email });
      if (!user) return RECORD_NOT_FOUND;
      if (user.emailVerified) return EMAIL_ALREADY_VERIFIED;

      const update = await this.userRepository.updateUser({id: user.id}, {emailVerified: true});
      if (update) {
        if (!(await this.walletService.isUserWalletExists({ userId: user.id }))) {
          await this.walletService.createUserWallet({ user });
        }
        await queryRunner.commitTransaction();

        return EMAIL_VERIFY_SUCCESS;
      }

      await queryRunner.rollbackTransaction();
      return EMAIL_VERIFY_FAILED;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      return INVALID_VERIFY_TOKEN;
    }
  }

  public async signInUser(data: {username: string, password: string}, fastify: FastifyInstance): Promise<{responseCode: string, responseDesc: string, accessToken?: string}> {
    try {
      const { username, password } = data;
      const user = await this.userRepository.findUser({ username, activeStatus: true });
      if (!user) return RECORD_NOT_FOUND;
      if (!user.emailVerified) return ACCOUNT_UNVERIFIED;
      if (!(await verifyHashedString(password, user.password))) return WRONG_LOGIN_CREDENTIALS;

      const payload = {userId: user.id, username: user.username, email: user.email};
      const accessToken = await fastify.jwt.sign(payload);

      await this.processPreviousCustomerSession({user, token: accessToken});
      return { ...LOGIN_SUCCESS, accessToken };
    } catch (error) {
      console.error(error);
      return LOGIN_FAILED;
    }
  }

  public async getUserDetailsById(userId: number): Promise<{responseCode: string, responseDesc: string, data?: User}> {
    try {
      const user = await this.userRepository.findUser({ id: userId, activeStatus: true });
      if (!user) return RECORD_NOT_FOUND;
      return {...SUCCESS, data: user};
    } catch (error) {
      return RECORD_NOT_FOUND;
    }
  }


  public async getUserDetailsByName(name: string): Promise<{responseCode: string, responseDesc: string, data?: User}> {
    try {
      const user = await this.userRepository.findUserInfo({ name, activeStatus: true });
      if (!user) return RECORD_NOT_FOUND;
      return {...SUCCESS, data: user};
    } catch (error) {
      return RECORD_NOT_FOUND;
    }
  }


  private async processPreviousCustomerSession(data: {user: User, token: string}): Promise<boolean> {
    try {
      const { user, token } = data;
      await this.userAuthSessionRepository.updateUserAuthSession({user}, {activeStatus: false, delStatus: true, expiredAt: currentDateTime()});
      const authSessionSave = await this.userAuthSessionRepository.saveUserAuthSession({user, token, status: "LI", loggedInAt: currentDateTime()});
      return (authSessionSave) ? true : false;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
}
