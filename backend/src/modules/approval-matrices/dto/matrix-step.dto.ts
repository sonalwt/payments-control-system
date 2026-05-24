import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApproverType } from '../approval-matrix-step.entity';

export class MatrixStepDto {
  @ApiProperty({ minimum: 1, description: '1-based sequential position in the chain' })
  @IsInt()
  @Min(1)
  stepOrder!: number;

  @ApiProperty({ enum: ApproverType })
  @IsEnum(ApproverType)
  approverType!: ApproverType;

  @ApiPropertyOptional({ description: 'Required when approverType=USER' })
  @ValidateIf((o: MatrixStepDto) => o.approverType === ApproverType.USER)
  @IsUUID()
  approverUserId?: string;

  @ApiPropertyOptional({ description: 'Required when approverType=ROLE' })
  @ValidateIf((o: MatrixStepDto) => o.approverType === ApproverType.ROLE)
  @IsUUID()
  approverRoleId?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isOptional?: boolean;
}
