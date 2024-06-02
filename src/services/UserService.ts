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

/**
 * Service class to handle user-related operations.
 */
export class UserService {

  private readonly userRepository: UserRepository;
  private readonly userAuthSessionRepository: UserAuthSessionRepository;
  private readonly walletRepository: WalletRepository;
  private walletService: WalletService | undefined;

  /**
   * Constructor to initialize the UserService.
   */
  constructor() {
    this.userRepository = new UserRepository();
    this.userAuthSessionRepository = new UserAuthSessionRepository();
    this.walletRepository = new WalletRepository();
  }

  /**
   * Sets the WalletService dependency for the UserService.
   * @param {WalletService} walletService - The WalletService instance to be set.
   */
  public setWalletService(walletService: WalletService) {
    this.walletService = walletService;
  }


  /**
   * Registers a new user.
   * @param {Object} data - The data object containing name, username, email, and password.
   * @param {string} data.name - The name of the user.
   * @param {string} data.username - The username of the user.
   * @param {string} data.email - The email of the user.
   * @param {string} data.password - The password of the user.
   * @param {FastifyInstance} fastify - The Fastify instance.
   * @returns {Promise<{responseCode: string, responseDesc: string}>} A promise representing the registration response.
   */
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


  /**
   * Generates an email verification token for a user.
   * @param {User} user - The user object for which the token is generated.
   * @param {FastifyInstance} fastify - The Fastify instance.
   * @returns {string} The generated email verification token.
   */
  private generateEmailVerificationToken(user: User, fastify: FastifyInstance): string {
    const payload = { userId: user.id, email: user.email };
    const options = { expiresIn: '1h' };
    return fastify.jwt.sign(payload, options);
  }


  /**
   * Verifies a user's email using the verification token.
   * @param {string} token - The verification token sent to the user's email.
   * @param {FastifyInstance} fastify - The Fastify instance.
   * @returns {Promise<{responseCode: string, responseDesc: string}>} A promise representing the email verification response.
   */
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


  /**
   * Authenticates a user based on username and password.
   * @param {Object} data - The data object containing username and password.
   * @param {string} data.username - The username of the user.
   * @param {string} data.password - The password of the user.
   * @param {FastifyInstance} fastify - The Fastify instance.
   * @returns {Promise<{responseCode: string, responseDesc: string, accessToken?: string}>} A promise representing the authentication response.
   */
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


  /**
   * Retrieves user details by user ID.
   * @param {number} userId - The ID of the user.
   * @returns {Promise<{responseCode: string, responseDesc: string, data?: User}>} A promise representing the user details response.
   */
  public async getUserDetailsById(userId: number): Promise<{responseCode: string, responseDesc: string, data?: User}> {
    try {
      const user = await this.userRepository.findUser({ id: userId, activeStatus: true });
      if (!user) return RECORD_NOT_FOUND;
      return {...SUCCESS, data: user};
    } catch (error) {
      return RECORD_NOT_FOUND;
    }
  }

  /**
   * Retrieves user details by user Name.
   * @param {string} name - The Name of the user.
   * @returns {Promise<{responseCode: string, responseDesc: string, data?: User}>} A promise representing the user details response.
   */
  public async getUserDetailsByName(name: string): Promise<{responseCode: string, responseDesc: string, data?: User}> {
    try {
      const user = await this.userRepository.findUserInfo({ name, activeStatus: true });
      if (!user) return RECORD_NOT_FOUND;
      return {...SUCCESS, data: user};
    } catch (error) {
      return RECORD_NOT_FOUND;
    }
  }

  /**
   * Save customer sessions.
   * @param {Object} data - The data object containing user and token.
   * @param {User} user - The user object for which the token is generated.
   * @param {string} data.token - The token.
   * @returns {Promise<boolean>} A promise of boolean representing whether the record has been saved or not.
   */
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
