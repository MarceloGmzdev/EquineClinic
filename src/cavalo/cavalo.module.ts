import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CavaloOrmEntity } from './infrastructure/persistence/typeorm/cavalo.orm-entity';
import { CavaloTypeOrmRepository } from './infrastructure/persistence/typeorm/cavalo.typeorm.repository';
import { CAVALO_REPOSITORY_PORT } from './application/ports/cavalo.repository.port';
import { CavaloService } from './application/cavalo.service';
import { CavaloController } from './presentation/cavalo.controller';

@Module({
    imports: [TypeOrmModule.forFeature([CavaloOrmEntity])],
    controllers: [CavaloController],
    providers: [
        CavaloService,
        {
            provide: CAVALO_REPOSITORY_PORT,
            useClass: CavaloTypeOrmRepository,
        },
    ],
    exports: [CAVALO_REPOSITORY_PORT, CavaloService],
})
export class CavaloModule { }