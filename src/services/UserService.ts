import { FastifyInstance } from 'fastify';

import { User } from '../models/User';
import { UserRepository } from '../repositories/UserRepository';
import { UserAuthSessionRepository } from '../repositories/UserAuthSessionRepository';

import { hashString, verifyHashedString, currentDateTime  } from "../utils/util";
import { sendVerificationEmail } from '../utils/EmailService';

import { SUCCESS, FAILURE, USER_CREATION_FAILED, USER_CREATION_SUCCESS, USERNAME_EXISTS, EMAIL_EXISTS, RECORD_NOT_FOUND, EMAIL_ALREADY_VERIFIED, EMAIL_VERIFY_FAILED, EMAIL_VERIFY_SUCCESS, INVALID_VERIFY_TOKEN, ACCOUNT_UNVERIFIED, WRONG_LOGIN_CREDENTIALS, LOGIN_SUCCESS } from "../utils/constant";



export class UserService {

  private readonly userAuthSessionRepository: UserAuthSessionRepository;


constructor(private readonly userRepository: UserRepository) {
  this.userAuthSessionRepository = new UserAuthSessionRepository();
}


  /**
   * Registers a new user.
   * @param data - Object containing name, username, email, and password.
   * @returns The newly created user.
   * @throws Error if username or email already exists.
   */
  async registerUser(data: {name: string, username: string, email: string, password: string}, fastify: FastifyInstance): Promise<{responseCode: string, responseDesc: string}> {
    console.log(data);
    
    const { name, username, email, password } = data;

    // Check if username or email already exists
    const existingUserByUsername = await this.userRepository.findUser({ username });
    if (existingUserByUsername) {
      return USERNAME_EXISTS;
    }


    const existingUserByEmail = await this.userRepository.findUser({ email });
    if (existingUserByEmail) {
      return EMAIL_EXISTS;
    }

    // Hash the password    
    const passwordHash = await hashString(password);
    const userData = { ...data, password: passwordHash, emailVerified: false };

    // Create the user
    const user = await this.userRepository.saveUser(userData);

    // Generate an email verification token
    const verificationToken = this.generateEmailVerificationToken(user, fastify);

    // Send verification email
    await sendVerificationEmail(user.email, verificationToken);

    return USER_CREATION_SUCCESS;
  }



  /**
   * Generates an email verification token for the user.
   * @param user - The user for whom to generate the token.
   * @returns The email verification token.
   */
  private generateEmailVerificationToken(user: User, fastify: FastifyInstance): string {
    const payload = { userId: user.id, email: user.email };
    const options = { expiresIn: '1h' };
    return fastify.jwt.sign(payload, options);
  }

  /**
   * Verifies the user's email.
   * @param token - The email verification token.
   * @returns The updated user with emailVerified set to true.
   * @throws Error if the token is invalid or expired.
   */
  async verifyEmail(token: string, fastify: FastifyInstance): Promise<{responseCode: string, responseDesc: string}> {
    try {
      const decoded = fastify.jwt.verify(token) as { userId: number; email: string };

      const user = await this.userRepository.findUser({ id: decoded.userId, email: decoded.email });
      if (!user) {
        return RECORD_NOT_FOUND;
      }

      if (user.emailVerified) {
        return EMAIL_ALREADY_VERIFIED;
      }

      const update = await this.userRepository.updateUser({id: user.id}, {emailVerified: true});
      if (update) {
        return EMAIL_VERIFY_SUCCESS;
      }
      return EMAIL_VERIFY_FAILED

    } catch (error) {
      return INVALID_VERIFY_TOKEN
    }
  }



  
  async signInUser(data: {username: string, password: string}, fastify: FastifyInstance): Promise<{responseCode: string, responseDesc: string, accessToken?: string}> {
    const { username, password } = data;

    const user = await this.userRepository.findUser({ username, activeStatus: true });
    if (!user) {
      return RECORD_NOT_FOUND;
    }

    if (!user.emailVerified) {
      return ACCOUNT_UNVERIFIED;
    }

    if (!(await verifyHashedString(password, user.password))){
      return WRONG_LOGIN_CREDENTIALS;
    }

    const payload = {userId: user.id, username: user.username, email: user.email};
    const options = { expiresIn: '24h' };
    const accessToken = await fastify.jwt.sign(payload, options);

     // Update user's authentication status    
    await this.processPreviousCustomerSession({user, token: accessToken});

    return { ...LOGIN_SUCCESS, accessToken };
  }



  async processPreviousCustomerSession(data: {user: User, token: string}): Promise<boolean>{
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