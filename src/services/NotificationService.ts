import { User } from '../models/User';
import { NotificationsRepository } from '../repositories/NotificationRepository';
import { dataSource } from '../utils/database/DataSource';

export class NotificationService {

    private readonly notificationsRepository: NotificationsRepository;

    constructor() {
        this.notificationsRepository = new NotificationsRepository();
    }


    public async processNotification(data: { userId: number, message: string }): Promise<boolean> {
        const queryRunner = dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const { userId, message } = data;
            const notificationEntity = this.notificationsRepository.createTransactionEntity({
                user: { id: userId } as User,
                message,
                status: "S",
                read: false,
            });
            await queryRunner.manager.save(notificationEntity);

            //Send real-time notification

            await queryRunner.commitTransaction();

            return true;

        } catch (error) {
            await queryRunner.rollbackTransaction();
            console.error(error);
            return false;
        } finally {
            await queryRunner.release();
        }
    }

}
