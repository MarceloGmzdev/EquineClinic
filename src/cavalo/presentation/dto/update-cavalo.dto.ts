import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateCavaloDto } from './create-cavalo.dto';

export class UpdateCavaloDto extends PartialType(CreateCavaloDto) {
    @ApiProperty({ description: 'Define se o cavalo está ativo no sistema (permite reativar cavalos inativos)', example: true, required: false })
    @IsOptional()
    @IsBoolean()
    ativo?: boolean;
}