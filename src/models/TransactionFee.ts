import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IsNotEmpty, Length, IsBoolean, IsNumber } from 'class-validator';
import { User } from './User';

@Entity({ name: 'transaction_fees' })
export class TransactionFee {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'trans_type' })
    @IsNotEmpty()
    @Length(1, 255)
    transType: string;

    @Column({ name: 'flat_percent' })
    @IsNotEmpty()
    @IsNumber()
    flatPercent: number;

    @Column({ type: 'decimal', precision: 11, scale: 2, nullable: true, default: 1 })
    @IsNotEmpty()
    @IsNumber()
    fee: number;

    @Column({ type: 'decimal', precision: 11, scale: 2, nullable: true, default: 1 })
    @IsNumber()
    cap: number;

    @Column({ name: 'limit_capped', type: 'decimal', precision: 11, scale: 2, nullable: true, default: 1 })
    @IsBoolean()
    limitCapped: boolean;

    @Column({ nullable: true })
    @Length(1, 255)
    comment: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'active_status', default: true })
    activeStatus: boolean;

    @Column({ name: 'del_status', default: false, nullable: true })
    delStatus: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', nullable: true, default: null })
    updatedAt: Date;
}
