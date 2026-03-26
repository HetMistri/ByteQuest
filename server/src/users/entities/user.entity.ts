import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryColumn('uuid')
  id: string;

  @Column('varchar', { name: 'display_name', length: 64, nullable: true })
  displayName: string | null;

  @Column('varchar', { length: 32, default: 'participant' })
  role: string;

  @CreateDateColumn()
  created_at: Date;
}
