import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsNumber, IsDateString, IsNotEmpty, Min } from 'class-validator';

export class CreateCavaloDto {
    @ApiProperty({ description: 'Nome do haras de origem', example: 'Haras Santa Helena' })
    @IsString()
    @IsNotEmpty()
    nomeHaras!: string;

    @ApiProperty({ description: 'Data de aquisição (ISO 8601)', example: '2024-06-15' })
    @IsDateString()
    dataAquisicao!: Date;

    @ApiProperty({ description: 'Se está em tratamento ativo', example: true })
    @IsBoolean()
    emTratamento!: boolean;

    @ApiProperty({ description: 'Valor de compra em reais', example: 15000 })
    @IsNumber()
    @Min(0.01)
    valorCompra!: number;
}