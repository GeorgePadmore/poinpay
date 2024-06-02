import { User } from '../models/User';
import { NotificationsRepository } from '../repositories/NotificationRepository';
import { dataSource } from '../utils/database/DataSource';

/**
 * Service class to handle notifications.
 */
export class NotificationService {

    private readonly notificationsRepository: NotificationsRepository;

    /**
     * Constructor to initialize the NotificationService.
     */
    constructor() {
        this.notificationsRepository = new NotificationsRepository();
    }


    /**
     * Processes a notification for a user.
     * @param {Object} data - The data object containing userId and message.
     * @param {number} data.userId - The ID of the user to whom the notification is sent.
     * @param {string} data.message - The message content of the notification.
     * @returns {Promise<boolean>} A promise indicating whether the notification was processed successfully.
     */
    public async processNotification(data: { userId: number, message: string }): Promise<boolean> {
        const queryRunner = dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const { userId, message } = data;

            // Create a notification entity
            const notificationEntity = this.notificationsRepository.createTransactionEntity({
                user: { id: userId } as User,
                message,
                status: "S",
                read: false,
            });

            // Save the notifiaction entity
            await queryRunner.manager.save(notificationEntity);

            //Send real-time notification

            //Commit the transcation
            await queryRunner.commitTransaction();

            return true;

        } catch (error) {
            //Rollback the transaction in case of an error. 
            await queryRunner.rollbackTransaction();
            console.error(error);
            return false;
        } finally {
            await queryRunner.release();
        }
    }

}
