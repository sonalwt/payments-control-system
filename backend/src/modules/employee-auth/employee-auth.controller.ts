import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EmployeeAuthService } from './employee-auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto, EmployeeLoginResponseDto } from './dto/verify-otp.dto';
import { Public } from '../../common/decorators/public.decorator';

/**
 * Passwordless login for the employee self-service portal. Both routes are
 * public (no token required) — they are the entry point that mints one.
 */
@ApiTags('Employee Auth')
@Controller('employee-auth')
export class EmployeeAuthController {
  constructor(private readonly service: EmployeeAuthService) {}

  @Public()
  @Post('request-otp')
  @HttpCode(HttpStatus.NO_CONTENT)
  requestOtp(@Body() dto: RequestOtpDto): Promise<void> {
    return this.service.requestOtp(dto.workEmail);
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  verifyOtp(@Body() dto: VerifyOtpDto): Promise<EmployeeLoginResponseDto> {
    return this.service.verifyOtp(dto.workEmail, dto.code);
  }
}
