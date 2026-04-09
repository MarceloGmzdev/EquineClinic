import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsNumber, IsDateString, IsNotEmpty, IsInt, Min, Max } from 'class-validator';

export class CreateSessaoFisioDto {
    @ApiProperty({ description: 'ID do cavalo associado', example: 1 })
    @IsInt()
    cavaloId!: number;

    @ApiProperty({ description: 'Foco anatômico da lesão', example: 'tendão flexor' })
    @IsString()
    @IsNotEmpty()
    focoLesao!: string;

    @ApiProperty({ description: 'Data da sessão (ISO 8601)', example: '2024-06-20' })
    @IsDateString()
    dataSessao!: Date;

    @ApiProperty({ description: 'Se houve boa progressão', example: false })
    @IsBoolean()
    progressoBoa!: boolean;

    @ApiProperty({ description: 'Duração em minutos (30–90)', example: 45 })
    @IsNumber()
    @Min(30)
    @Max(90)
    duracaoMin!: number;
}