import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CavaloOrmEntity } from '../../cavalo/infrastructure/persistence/typeorm/cavalo.orm-entity';
import { SessaoFisioOrmEntity } from '../../sessao-fisio/infrastructure/persistence/typeorm/sessao-fisio.orm-entity';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'data/equine.db',
      synchronize: true,/*Apenas em desenvolvimento */
      logging: true,
      entities: [CavaloOrmEntity, SessaoFisioOrmEntity],
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}