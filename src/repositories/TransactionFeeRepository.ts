import { EntityRepository, Repository } from 'typeorm';
import { TransactionFee } from 'src/models/TransactionFee';

@EntityRepository(TransactionFee)
export class TransactionFeeRepository extends Repository<TransactionFee>  {

}
