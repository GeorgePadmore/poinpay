import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    username: string;

    @Column()
    email: string;

    @Column()
    password: string;

    @Column({name: 'email_verified', default: null, nullable: true})
    emailVerified: boolean;

    @Column({ name: 'logged_in_status', nullable: true })
    loggedInStatus: string;

    @Column({ name: 'logged_in_at', nullable: true })
    loggedInAt: Date;

    @Column({ name: 'logged_out_at', nullable: true })
    loggedOutAt: Date;

    @Column({  nullable: true })
    other: string;

    @Column({ name: 'active_status', default: true })
    activeStatus: boolean;

    @Column({ name: 'del_status', default: false, nullable: true })
    delStatus: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', nullable: true })
    updatedAt: Date;


}
