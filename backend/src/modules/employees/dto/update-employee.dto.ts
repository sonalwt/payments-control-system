import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateEmployeeDto } from './create-employee.dto';

// employeeCode and legalEntityId form the unique identity of an employee and
// cannot be reassigned after creation.
export class UpdateEmployeeDto extends PartialType(
  OmitType(CreateEmployeeDto, ['employeeCode', 'legalEntityId'] as const),
) {}
