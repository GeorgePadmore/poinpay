import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IsNotEmpty, Length, IsBoolean } from 'class-validator';
import { User } from './User';

@Entity({ name: 'notifications' })
export class Notifications {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ nullable: false })
    @IsNotEmpty()
    @Length(1, 255)
    message: string;

    @Column({ nullable: false })
    @IsNotEmpty()
    @IsBoolean()
    read: boolean;

    @Column({ nullable: false })
    @IsNotEmpty()
    @Length(1, 255)
    status: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', nullable: true })
    updatedAt: Date;
}
