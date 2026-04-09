import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SessaoFisioService } from '../application/sessao-fisio.service';
import { CreateSessaoFisioDto } from './dto/create-sessao-fisio.dto';
import { UpdateSessaoFisioDto } from './dto/update-sessao-fisio.dto';

@ApiTags('Sessões de Fisioterapia')
@Controller('sessoes-fisio')
export class SessaoFisioController {
    constructor(private readonly sessaoFisioService: SessaoFisioService) { }

    @Post()
    @ApiOperation({ summary: 'Cadastrar nova sessão de fisioterapia' })
    @ApiResponse({ status: 201, description: 'Sessão cadastrada com sucesso' })
    @ApiResponse({ status: 400, description: 'Dados inválidos ou violação de regra de negócio' })
    @ApiResponse({ status: 403, description: 'Cavalo não está em tratamento ativo' })
    @ApiResponse({ status: 404, description: 'Cavalo não encontrado' })
    create(@Body() dto: CreateSessaoFisioDto) {
        return this.sessaoFisioService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Listar sessões com filtros e paginação' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'cavaloId', required: false, type: Number })
    @ApiQuery({ name: 'focoLesao', required: false, type: String })
    @ApiQuery({ name: 'progressoBoa', required: false, type: Boolean })
    @ApiQuery({ name: 'sort', required: false, enum: ['dataSessao', 'duracaoMin', 'cavaloId'] })
    @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
    @ApiQuery({ name: 'duracaoMinima', required: false, type: Number, description: 'Duração mínima (minutos)' })
    @ApiQuery({ name: 'duracaoMaxima', required: false, type: Number, description: 'Duração máxima (minutos)' })
    @ApiQuery({ name: 'dataSessaoInicio', required: false, type: String, description: 'Data início (YYYY-MM-DD)' })
    @ApiQuery({ name: 'dataSessaoFim', required: false, type: String, description: 'Data fim (YYYY-MM-DD)' })
    @ApiResponse({ status: 200, description: 'Lista de sessões retornada com sucesso' })
    findAll(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('cavaloId') cavaloId?: number,
        @Query('focoLesao') focoLesao?: string,
        @Query('progressoBoa') progressoBoa?: boolean,
        @Query('sort') sort?: 'dataSessao' | 'duracaoMin' | 'cavaloId',
        @Query('order') order?: 'asc' | 'desc',
        @Query('duracaoMinima') duracaoMinima?: number,
        @Query('duracaoMaxima') duracaoMaxima?: number,
        @Query('dataSessaoInicio') dataSessaoInicio?: string,
        @Query('dataSessaoFim') dataSessaoFim?: string,
    ) {
        const filters = { cavaloId, focoLesao, progressoBoa, sort, order, duracaoMinima, duracaoMaxima, dataSessaoInicio, dataSessaoFim };
        const pagination = { page: page ?? 1, limit: limit ?? 10 };
        return this.sessaoFisioService.findAll(filters, pagination);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Buscar sessão por ID' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, description: 'Sessão encontrada' })
    @ApiResponse({ status: 404, description: 'Sessão não encontrada' })
    findById(@Param('id', ParseIntPipe) id: number) {
        return this.sessaoFisioService.findById(id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Atualizar sessão de fisioterapia' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, description: 'Sessão atualizada com sucesso' })
    @ApiResponse({ status: 400, description: 'Dados inválidos' })
    @ApiResponse({ status: 404, description: 'Sessão não encontrada' })
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSessaoFisioDto) {
        return this.sessaoFisioService.update(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Desativar sessão de fisioterapia (soft delete)' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, description: 'Sessão desativada com sucesso — retorna o objeto desativado' })
    @ApiResponse({ status: 404, description: 'Sessão não encontrada' })
    delete(@Param('id', ParseIntPipe) id: number) {
        return this.sessaoFisioService.delete(id);
    }
}