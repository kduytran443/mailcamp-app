import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '@prisma/client';
import ms from 'ms';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { TokenPayload } from './token.payload';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(user: TokenPayload, res: Response, msg?: string) {
    const payload = { email: user.email, id: user.id, name: user.name, createdAt: user.createdAt, updatedAt: user.updatedAt };

    const accessExpStr = this.configService.getOrThrow('JWT_EXPIRES');
    const refreshExpStr = this.configService.getOrThrow('REFRESH_JWT_EXPIRES');

    const accessMs = ms(accessExpStr);
    const refreshMs = ms(refreshExpStr);

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: accessExpStr,
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: refreshExpStr,
    });

    const accessExpires = new Date(Date.now() + accessMs);
    const refreshExpires = new Date(Date.now() + refreshMs);

    // Set cookie
    const baseCookie = {
      httpOnly: true,
      secure: true,
      sameSite: 'strict' as const,
    };

    res.cookie('access_token', accessToken, {
      ...baseCookie,
      expires: accessExpires,
    });

    res.cookie('refresh_token', refreshToken, {
      ...baseCookie,
      expires: refreshExpires,
    });

    return {
      message: msg ?? 'Login successful',
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(refreshToken: string, res: Response) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.getOrThrow('JWT_SECRET'),
      });

      const user = await this.usersService.getUserByEmail(payload.email);
      if (!user) throw new ForbiddenException('User not found');

      return this.login({...user}, res);
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Validate user credentials.
   * 1) Find user by email
   * 2) Compare password with hashed password
   * 3) Return user if valid, otherwise throw error
   */
  async verifyUser(email: string, password: string) {
    // Find user by unique email
    const user = await this.usersService.getUserByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    // Compare plain password with hashed password
    const isMatch = await bcrypt.compare(password, user?.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    return user; // Passport attaches this to req.user
  }
}
