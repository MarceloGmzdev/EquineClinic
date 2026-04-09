import { PartialType } from '@nestjs/swagger';
import { CreateSessaoFisioDto } from './create-sessao-fisio.dto';

export class UpdateSessaoFisioDto extends PartialType(CreateSessaoFisioDto) { }