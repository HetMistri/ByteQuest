import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryColumn('uuid')
  id: string;

  @Column('varchar', { unique: true, length: 255 })
  username: string;

  @Column('varchar', { unique: true, length: 255 })
  email: string;

  @CreateDateColumn()
  created_at: Date;

  @Column('varchar', { nullable: true, length: 255 })
  display_name?: string;
}
