import { Body, Controller, Post } from '@nestjs/common';
import { CreateUserRequestDTO } from './dto/create-user-request.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {

  constructor(private readonly usersService: UsersService) {};

  @Post()
  createUser(@Body() dto: CreateUserRequestDTO) {
    return this.usersService.createUser(dto);
  }
}
