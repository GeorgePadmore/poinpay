import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IsNotEmpty, IsNumber, Length } from 'class-validator';
import { User } from './User';

@Entity({ name: 'transactions' })
export class Transaction {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'transaction_id', nullable: false, unique: true })
    @IsNotEmpty()
    @Length(1, 255)
    transactionId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'sender_id' })
    sender: User;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'recipient_id' })
    recipient: User;

    @Column({ type: 'decimal', precision: 11, scale: 2, nullable: false, default: 0 })
    @IsNotEmpty()
    @IsNumber()
    amount: number;

    @Column({ type: 'decimal', precision: 11, scale: 2, nullable: false, default: 0 })
    @IsNotEmpty()
    @IsNumber()
    charge: number;

    @Column({ nullable: false, default: 'GHS' })
    @IsNotEmpty()
    @Length(1, 10)
    currency: string;

    @Column({ name: 'idempotency_key', nullable: false, unique: true })
    @IsNotEmpty()
    @Length(1, 255)
    idempotencyKey: string;

    @Column({ name: 'trans_type', nullable: false })
    @IsNotEmpty()
    @Length(1, 255)
    transType: string;

    @Column({ nullable: true })
    @Length(1, 255)
    src: string;

    @Column({ nullable: true, default: null })
    @IsNotEmpty()
    @Length(1, 255)
    status: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', nullable: true, default: null })
    updatedAt: Date;
}
