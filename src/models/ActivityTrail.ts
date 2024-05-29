import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IsNotEmpty, Length } from 'class-validator';
import { User } from './User';

@Entity({ name: 'activity_trails' })
export class ActivityTrail {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'content_type', nullable: true })
    @Length(1, 255)
    contentType: string;

    @Column({ name: 'content_id', nullable: true })
    @IsNotEmpty()
    contentId: number;

    @Column()
    @Length(1, 255)
    action: string;

    @Column({ nullable: true })
    @Length(1, 255)
    description: string;

    @Column({ name: 'ip_address', nullable: true })
    @Length(1, 255)
    ipAddress: string;

    @Column({ name: 'user_agent', nullable: true })
    @Length(1, 255)
    userAgent: string;

    @Column({ nullable: true })
    @Length(1, 255)
    src: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'active_status', default: true })
    activeStatus: boolean;

    @Column({ name: 'del_status', default: false, nullable: true })
    delStatus: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', nullable: true })
    updatedAt: Date;
}
