import { Module } from '@nestjs/common';
import { DatabaseModule } from './shared/database/database.module';
import { CavaloModule } from './cavalo/cavalo.module';
import { SessaoFisioModule } from './sessao-fisio/sessao-fisio.module';

@Module({
  imports: [DatabaseModule, CavaloModule, SessaoFisioModule],
})
export class AppModule { }