import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CavaloOrmEntity } from '../../../../cavalo/infrastructure/persistence/typeorm/cavalo.orm-entity';

@Entity('sessao_fisio')
export class SessaoFisioOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  cavaloId!: number;

  @Column()
  focoLesao!: string;

  @Column({ type: 'date' })
  dataSessao!: Date;

  @Column()
  progressoBoa!: boolean;

  @Column()
  duracaoMin!: number;

  @Column({ default: true })
  ativo!: boolean;

  @ManyToOne(() => CavaloOrmEntity, (cavalo) => cavalo.sessoes)
  @JoinColumn({ name: 'cavaloId' })
  cavalo!: CavaloOrmEntity;
}