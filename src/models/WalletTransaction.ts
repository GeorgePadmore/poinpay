import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IsNotEmpty, IsNumber, Length } from 'class-validator';
import { User } from './User';

@Entity({ name: 'wallet_transactions' })
export class WalletTransaction {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'transaction_id', nullable: false })
    @IsNotEmpty()
    @Length(1, 255)
    transactionId: string;

    @Column({ type: 'decimal', precision: 11, scale: 2, nullable: false, default: 0 })
    @IsNotEmpty()
    @IsNumber()
    amount: number;

    @Column({ name: 'net_amount', type: 'decimal', precision: 11, scale: 2, nullable: false, default: 0 })
    @IsNotEmpty()
    @IsNumber()
    netAmount: number;

    @Column({ type: 'decimal', precision: 11, scale: 2, nullable: false, default: 0 })
    @IsNotEmpty()
    @IsNumber()
    charge: number;

    @Column({ name: 'gross_bal_bef', type: 'decimal', precision: 11, scale: 2, nullable: false, default: 0 })
    @IsNotEmpty()
    @IsNumber()
    grossBalBef: number;

    @Column({ name: 'gross_bal_aft', type: 'decimal', precision: 11, scale: 2, nullable: false, default: 0 })
    @IsNotEmpty()
    @IsNumber()
    grossBalAft: number;

    @Column({ name: 'net_bal_bef', type: 'decimal', precision: 11, scale: 2, nullable: false, default: 0 })
    @IsNotEmpty()
    @IsNumber()
    netBalBef: number;

    @Column({ name: 'net_bal_aft', type: 'decimal', precision: 11, scale: 2, nullable: false, default: 0 })
    @IsNotEmpty()
    @IsNumber()
    netBalAft: number;

    @Column({ name: 'trans_type', nullable: false })
    @IsNotEmpty()
    @Length(1, 255)
    transType: string;

    @Column({ name: 'network_trans_id', nullable: true })
    @Length(1, 255)
    networkTransId: string;

    @Column({ nullable: false })
    @IsNotEmpty()
    @Length(1, 255)
    status: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', nullable: true })
    updatedAt: Date;
}
