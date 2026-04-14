import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateSessaoFisioDto } from './create-sessao-fisio.dto';

export class UpdateSessaoFisioDto extends PartialType(CreateSessaoFisioDto) {
    @ApiProperty({ description: 'Define se a sessão está ativa no sistema (permite reativar sessões inativas)', example: true, required: false })
    @IsOptional()
    @IsBoolean()
    ativo?: boolean;
}