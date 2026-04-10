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

  /**
   * O driver better-sqlite3 retorna valores de colunas `decimal` como string.
   * O transformer garante que o valor seja sempre um número em runtime,
   * evitando bugs silenciosos em validações e operações aritméticas.
   */
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => (typeof value === 'string' ? parseFloat(value) : value),
    },
  })
  valorCompra!: number;

  @Column({ default: true })
  ativo!: boolean;

  @OneToMany(() => SessaoFisioOrmEntity, (sessao) => sessao.cavalo)
  sessoes!: SessaoFisioOrmEntity[];
}