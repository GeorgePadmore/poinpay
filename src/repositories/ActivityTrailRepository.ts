import { EntityRepository, Repository } from 'typeorm';
import { ActivityTrail } from 'src/models/ActivityTrail';

@EntityRepository(ActivityTrail)
export class ActivityTrailRepository extends Repository<ActivityTrail>  {

}
