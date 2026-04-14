import { ApiProperty } from '@nestjs/swagger';

export class SessaoFisioResponseDto {
    @ApiProperty({ description: 'ID da sessão de fisioterapia', example: 1 })
    id!: number;

    @ApiProperty({ description: 'ID do cavalo associado', example: 1 })
    cavaloId!: number;

    @ApiProperty({ description: 'Foco anatômico da lesão', example: 'tendão flexor' })
    focoLesao!: string;

    @ApiProperty({ description: 'Data da sessão', example: '2024-06-20T00:00:00.000Z' })
    dataSessao!: Date;

    @ApiProperty({ description: 'Se houve boa progressão na sessão', example: false })
    progressoBoa!: boolean;

    @ApiProperty({ description: 'Duração da sessão em minutos', example: 45 })
    duracaoMin!: number;

    @ApiProperty({ description: 'Status indicando se a sessão está ativa', example: true })
    ativo!: boolean;
}

export class SessaoFisioComAlertaResponseDto extends SessaoFisioResponseDto {
    @ApiProperty({ 
        description: 'Alerta gerado caso existam 3 sessões consecutivas sem progressão', 
        example: 'Alerta: 3 sessões consecutivas sem progressão para a lesão "tendão flexor". Revisão do protocolo de tratamento recomendada.',
        required: false,
        nullable: true,
        type: String
    })
    alerta!: string | null;
}
