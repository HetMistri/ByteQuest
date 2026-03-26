import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryColumn('uuid')
  id: string;

  @Column('varchar', { length: 32, default: 'participant' })
  role: string;

  @CreateDateColumn()
  created_at: Date;
}
