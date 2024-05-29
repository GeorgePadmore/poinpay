import { EntityRepository, Repository } from 'typeorm';
import { UserAuthSession } from 'src/models/UserAuthSession';

@EntityRepository(UserAuthSession)
export class UserAuthSessionRepository extends Repository<UserAuthSession>  {

}
