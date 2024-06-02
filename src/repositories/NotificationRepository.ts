import { dataSource } from '../utils/database/DataSource';
import { Repository } from 'typeorm';
import { Notifications } from '../models/Notification';

export class NotificationsRepository {
    private notificationsRepository: Repository<Notifications>;

    constructor() {
        this.notificationsRepository = dataSource.getRepository(Notifications);
    }

    public createTransactionEntity(record: Partial<Notifications>): Notifications {
        return this.notificationsRepository.create(record);
    }

    public async saveTransaction(record: Notifications): Promise<Notifications> {
        return await this.notificationsRepository.save(record);
    }

    public async findNotificationDetails(where: Partial<Notifications>): Promise<Notifications | undefined> {
        return await this.notificationsRepository.findOne({
            where
        });
    }

    public async updateNotificationRecord(where: Partial<Notifications>, data: Partial<Notifications>): Promise<Notifications | undefined> {
        await this.notificationsRepository.update(where, data);
        return await this.notificationsRepository.findOne({ where });
    }

    public async updateNotificationRecordOnly(where: Partial<Notifications>, data: Partial<Notifications>): Promise<boolean> {
        const update = await this.notificationsRepository.update(where, data);
        return update.affected > 0;
    }
}
