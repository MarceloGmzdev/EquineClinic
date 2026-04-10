import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CavaloOrmEntity } from '../../cavalo/infrastructure/persistence/typeorm/cavalo.orm-entity';
import { SessaoFisioOrmEntity } from '../../sessao-fisio/infrastructure/persistence/typeorm/sessao-fisio.orm-entity';

const isDev = process.env.NODE_ENV !== 'production';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'data/equine.db',
      /**
       * synchronize e logging são habilitados apenas em ambiente de desenvolvimento.
       * Em produção, utilize migrations explícitas para evitar perda acidental de dados.
       */
      synchronize: isDev,
      logging: isDev,
      entities: [CavaloOrmEntity, SessaoFisioOrmEntity],
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}