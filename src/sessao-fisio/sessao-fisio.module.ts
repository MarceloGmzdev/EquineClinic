import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessaoFisioOrmEntity } from './infrastructure/persistence/typeorm/sessao-fisio.orm-entity';
import { SessaoFisioTypeOrmRepository } from './infrastructure/persistence/typeorm/sessao-fisio.typeorm.repository';
import { SESSAO_FISIO_REPOSITORY_PORT } from './application/ports/sessao-fisio.repository.port';
import { SessaoFisioService } from './application/sessao-fisio.service';
import { SessaoFisioController } from './presentation/sessao-fisio.controller';
import { CavaloModule } from '../cavalo/cavalo.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([SessaoFisioOrmEntity]),
        CavaloModule, // Importa para acessar CAVALO_REPOSITORY_PORT
    ],
    controllers: [SessaoFisioController],
    providers: [
        SessaoFisioService,
        {
            provide: SESSAO_FISIO_REPOSITORY_PORT,
            useClass: SessaoFisioTypeOrmRepository,
        },
    ],
})
export class SessaoFisioModule { }