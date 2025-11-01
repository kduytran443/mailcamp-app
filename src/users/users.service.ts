import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserRequestDTO } from './dto/create-user-request.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {

  constructor(private readonly prismaService: PrismaService) {}

  isEmailExistByOthers = async(email: string, id?: string) => {
    const existing = await this.prismaService.user.findFirst({
      where: {email},
      select: {id: true}
    })
    return !!existing && existing.id !== id;
  }

  async createUser(dto: CreateUserRequestDTO): Promise<Partial<User>> {
    const emailExisting = await this.isEmailExistByOthers(dto.email);
    if (emailExisting) {
      throw new BadRequestException(`Email '${dto.email}' is already used by another user`);
    }
    return this.prismaService.user.create({
      data: {
        ...dto,
        password: await bcrypt.hash(dto.password, 10)
      },
      select: {
        id: true,
        email: true
      }
    });
  }
}
