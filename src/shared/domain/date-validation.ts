import { BadRequestDomainException } from '../exceptions/bad-request.exception';
export function assertDataNaoFutura(data: Date, campo: string): void {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataComparada = new Date(data);
    dataComparada.setHours(0, 0, 0, 0);
    if (dataComparada > hoje) {
        throw new BadRequestDomainException(`${campo} não pode ser uma data futura`);
    }
}