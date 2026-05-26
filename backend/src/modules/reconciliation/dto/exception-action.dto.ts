import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class StartInvestigationDto {
  @IsString() @IsOptional() note?: string;
}

export class ResolveExceptionDto {
  @IsString() @IsNotEmpty() resolutionNote!: string;
}

export class ConfirmExceptionDto {
  @IsString() @IsNotEmpty() resolutionNote!: string;
}
