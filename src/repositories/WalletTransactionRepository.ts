import { EntityRepository, Repository } from 'typeorm';
import { WalletTransaction } from 'src/models/WalletTransaction';

@EntityRepository(WalletTransaction)
export class WalletTransactionRepository extends Repository<WalletTransaction>  {

}
