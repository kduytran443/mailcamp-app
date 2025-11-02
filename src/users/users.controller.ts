import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CreateUserRequestDTO } from './dto/create-user-request.dto';
import { UsersService } from './users.service';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { User } from '@prisma/client';
import type { TokenPayload } from 'src/auth/token.payload';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';

@Controller('users')
export class UsersController {

  constructor(private readonly usersService: UsersService) {};

  @Post()
  createUser(@Body() dto: CreateUserRequestDTO) {
    return this.usersService.createUser(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: TokenPayload) {
    return user;
  }
}
