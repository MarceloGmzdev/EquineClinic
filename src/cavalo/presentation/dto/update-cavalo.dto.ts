import { PartialType } from '@nestjs/swagger';
import { CreateCavaloDto } from './create-cavalo.dto';

export class UpdateCavaloDto extends PartialType(CreateCavaloDto) { }