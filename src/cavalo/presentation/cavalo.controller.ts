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
    ParseBoolPipe,
    DefaultValuePipe,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CavaloService } from '../application/cavalo.service';
import { CreateCavaloDto } from './dto/create-cavalo.dto';
import { UpdateCavaloDto } from './dto/update-cavalo.dto';


@ApiTags('Cavalos')
@Controller('cavalos')
export class CavaloController {
    constructor(private readonly cavaloService: CavaloService) { }

    @Post()
    @ApiOperation({ summary: 'Cadastrar um novo cavalo' })
    @ApiResponse({ status: 201, description: 'Cavalo cadastrado com sucesso' })
    @ApiResponse({ status: 400, description: 'Dados inválidos ou data futura' })
    create(@Body() dto: CreateCavaloDto) {
        return this.cavaloService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Listar cavalos com filtros e paginação' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'nomeHaras', required: false, type: String })
    @ApiQuery({ name: 'emTratamento', required: false, type: Boolean })
    @ApiQuery({ name: 'sort', required: false, enum: ['nomeHaras', 'dataAquisicao', 'valorCompra'] })
    @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
    @ApiQuery({ name: 'valorCompraMin', required: false, type: Number, description: 'Valor de compra mínimo' })
    @ApiQuery({ name: 'valorCompraMax', required: false, type: Number, description: 'Valor de compra máximo' })
    @ApiQuery({ name: 'dataAquisicaoInicio', required: false, type: String, description: 'Data de aquisição início (YYYY-MM-DD)' })
    @ApiQuery({ name: 'dataAquisicaoFim', required: false, type: String, description: 'Data de aquisição fim (YYYY-MM-DD)' })
    @ApiResponse({ status: 200, description: 'Lista de cavalos retornada com sucesso' })
    findAll(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
        @Query('nomeHaras') nomeHaras?: string,
        @Query('emTratamento', new DefaultValuePipe(undefined)) emTratamentoRaw?: string,
        @Query('sort') sort?: 'nomeHaras' | 'dataAquisicao' | 'valorCompra',
        @Query('order') order?: 'asc' | 'desc',
        @Query('valorCompraMin', new DefaultValuePipe(undefined), new ParseIntPipe({ optional: true })) valorCompraMin?: number,
        @Query('valorCompraMax', new DefaultValuePipe(undefined), new ParseIntPipe({ optional: true })) valorCompraMax?: number,
        @Query('dataAquisicaoInicio') dataAquisicaoInicio?: string,
        @Query('dataAquisicaoFim') dataAquisicaoFim?: string,
    ) {
        // ParseBoolPipe rejeita valores não booleanos — convertemos manualmente para suportar undefined
        const emTratamento = emTratamentoRaw === 'true' ? true : emTratamentoRaw === 'false' ? false : undefined;
        const filters = { nomeHaras, emTratamento, sort, order, valorCompraMin, valorCompraMax, dataAquisicaoInicio, dataAquisicaoFim };
        const pagination = { page, limit };
        return this.cavaloService.findAll(filters, pagination);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Buscar cavalo por ID' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, description: 'Cavalo encontrado' })
    @ApiResponse({ status: 404, description: 'Cavalo não encontrado' })
    @ApiResponse({ status: 410, description: 'Cavalo inativo' })
    findById(@Param('id', ParseIntPipe) id: number) {
        return this.cavaloService.findById(id);
    }

    @Get(':id/sessoes')
    @ApiOperation({ summary: 'Buscar cavalo por ID com sessões de fisioterapia' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, description: 'Cavalo e suas sessões retornados com sucesso' })
    @ApiResponse({ status: 404, description: 'Cavalo não encontrado' })
    @ApiResponse({ status: 410, description: 'Cavalo inativo' })
    findByIdWithSessoes(@Param('id', ParseIntPipe) id: number) {
        return this.cavaloService.findByIdWithSessoes(id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Atualizar cavalo' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, description: 'Cavalo atualizado com sucesso' })
    @ApiResponse({ status: 400, description: 'Dados inválidos' })
    @ApiResponse({ status: 404, description: 'Cavalo não encontrado' })
    @ApiResponse({ status: 410, description: 'Cavalo inativo' })
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCavaloDto) {
        return this.cavaloService.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Desativar cavalo (soft delete)' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, description: 'Cavalo desativado com sucesso — retorna o objeto desativado' })
    @ApiResponse({ status: 404, description: 'Cavalo não encontrado' })
    @ApiResponse({ status: 410, description: 'Cavalo já estava inativo' })
    deactivate(@Param('id', ParseIntPipe) id: number) {
        return this.cavaloService.deactivate(id);
    }
}