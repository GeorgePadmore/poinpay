import { EntityRepository, Repository } from 'typeorm';
import { Wallet } from 'src/models/Wallet';

@EntityRepository(Wallet)
export class WalletRepository extends Repository<Wallet>  {

}
