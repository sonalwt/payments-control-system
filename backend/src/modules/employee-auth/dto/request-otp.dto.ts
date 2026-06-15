import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class RequestOtpDto {
  @ApiProperty({ example: 'jane.doe@company.com', description: "Employee's work email." })
  @IsEmail()
  workEmail!: string;
}
