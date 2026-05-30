import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserRole } from './user-role.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
@Module({
  imports: [TypeOrmModule.forFeature([User, UserRole])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
