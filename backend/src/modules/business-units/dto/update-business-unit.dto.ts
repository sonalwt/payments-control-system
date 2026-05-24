import { PartialType } from '@nestjs/swagger';
import { CreateBusinessUnitDto } from './create-business-unit.dto';

export class UpdateBusinessUnitDto extends PartialType(CreateBusinessUnitDto) {}
