import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IsNotEmpty, IsNumber, Length } from 'class-validator';
import { User } from './User';

@Entity({ name: 'wallets' })
export class Wallet {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'gross_bal', type: 'decimal', precision: 11, scale: 2, nullable: false, default: 0 })
    @IsNotEmpty()
    @IsNumber()
    grossBal: number;

    @Column({ name: 'net_bal', type: 'decimal', precision: 11, scale: 2, nullable: false, default: 0 })
    @IsNotEmpty()
    @IsNumber()
    netBal: number;

    @Column({ nullable: false, default: 'GHS' })
    @IsNotEmpty()
    @Length(1, 10)
    currency: string;

    @Column({ name: 'active_status', default: true })
    activeStatus: boolean;

    @Column({ name: 'del_status', default: false, nullable: true })
    delStatus: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', nullable: true, default: null })
    updatedAt: Date;
}
