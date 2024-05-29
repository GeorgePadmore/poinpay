import { EntityRepository, Repository } from 'typeorm';
import { AuthRequest } from 'src/models/AuthRequest';

@EntityRepository(AuthRequest)
export class AuthRequestRepository extends Repository<AuthRequest>  {

}
