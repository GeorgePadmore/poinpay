import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IsNotEmpty, Length, IsEmail } from 'class-validator';

@Entity({ name: 'auth_requests' })
export class AuthRequest {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    @IsEmail()
    email: string;

    @Column({ name: 'secret_code' })
    @IsNotEmpty()
    secretCode: string;

    @Column({ nullable: true, default: null })
    expired: boolean;
    
    @Column({ name: 'expiry_time', type: 'timestamp', nullable: true })
    expiryTime: Date;

    @Column({ nullable: true })
    @Length(1, 255)
    status: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', nullable: true })
    updatedAt: Date;
}
