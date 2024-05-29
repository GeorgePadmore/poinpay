import { EntityRepository, Repository } from 'typeorm';
import { Transaction } from 'src/models/Transaction';

@EntityRepository(Transaction)
export class TransactionRepository extends Repository<Transaction>  {

}
