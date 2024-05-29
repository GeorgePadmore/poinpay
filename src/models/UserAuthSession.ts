import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IsNotEmpty, IsDate, Length } from 'class-validator';
import { User } from './User';

@Entity({ name: 'user_auth_sessions' })
export class UserAuthSession {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column()
    @IsNotEmpty()
    @Length(1, 255)
    token: string;

    @Column({ name: 'logged_in_at', type: 'timestamp', nullable: true })
    loggedInAt: Date;

    @Column({ name: 'expired_at', type: 'timestamp', nullable: true })
    expiredAt: Date;

    @Column({ nullable: true })
    @Length(1, 255)
    status: string;

    @Column({ nullable: true })
    @Length(1, 255)
    src: string;

    @Column({ name: 'active_status', default: true })
    activeStatus: boolean;

    @Column({ name: 'del_status', default: false, nullable: true })
    delStatus: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', nullable: true, default: null })
    updatedAt: Date;
}
