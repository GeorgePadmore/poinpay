import { EntityRepository, Repository } from 'typeorm';
import { Notifications } from 'src/models/Notification';

@EntityRepository(Notifications)
export class NotificationsRepository extends Repository<Notifications>  {

}
