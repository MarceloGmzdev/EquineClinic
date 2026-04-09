import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SessaoFisioOrmEntity } from '../../../../sessao-fisio/infrastructure/persistence/typeorm/sessao-fisio.orm-entity';

@Entity('cavalo')
export class CavaloOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nomeHaras!: string;

  @Column({ type: 'date' })
  dataAquisicao!: Date;

  @Column()
  emTratamento!: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valorCompra!: number;

  @Column({ default: true })
  ativo!: boolean;

  @OneToMany(() => SessaoFisioOrmEntity, (sessao) => sessao.cavalo)
  sessoes!: SessaoFisioOrmEntity[];
}