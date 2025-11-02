import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { randomBytes } from 'crypto';
import ms from 'ms';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { TokenPayload } from './token.payload';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { sendVerificationEmail } from 'src/utils/email.utils';
import { addMinutes, isAfter } from 'date-fns';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async assignTokens(user: TokenPayload, res: Response, msg?: string) {
    const payload = { email: user.email, id: user.id, name: user.name, createdAt: user.createdAt, updatedAt: user.updatedAt };

    const accessExpStr = this.configService.getOrThrow('JWT_EXPIRES');
    const refreshExpStr = this.configService.getOrThrow('REFRESH_JWT_EXPIRES');

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: accessExpStr,
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: refreshExpStr,
    });

    const accessExpires = new Date(Date.now() + ms(accessExpStr));
    const refreshExpires = new Date(Date.now() + ms(refreshExpStr));

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

      return this.assignTokens({...user}, res);
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async signup(dto: RegisterDto) {
    // Check if email already exists
    const existingUser = await this.prismaService.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) throw new BadRequestException('Email already registered');

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Generate email verification token
    const emailToken = randomBytes(32).toString('hex');
    const emailTokenExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    // Create user
    const user = await this.prismaService.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        status: 'PENDING',
        emailToken,
        emailTokenExpires,
        role: 'USER',
      },
    });

    // Send verification email (pseudo code)
    await sendVerificationEmail(user.email, emailToken);
  }

  // Verify email
  async verifyEmail(token: string) {
    const user = await this.prismaService.user.findFirst({
      where: { emailToken: token },
    });
    if (!user) throw new BadRequestException('Invalid verification token');

    if (!user.emailTokenExpires || isAfter(new Date(), user.emailTokenExpires)) {
      throw new ForbiddenException('Verification token expired');
    }

    // Update user status to activated
    await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        status: 'ACTIVATED',
        emailToken: null,
        emailTokenExpires: null,
      },
    });
  }

  async retrySendVerificationEmail(email: string) {
    const user = await this.prismaService.user.findUnique({ where: { email } });

    if (!user) {
      throw new ForbiddenException('User not found');
    }
    if (user.status === 'ACTIVATED') {
      throw new ForbiddenException('User already verified');
    }

    // Generate a new email verification token
    const newToken = randomBytes(32).toString('hex');
    const newTokenExpires = addMinutes(new Date(), 5); // 5 minutes expiry

    // Update user with new token
    await this.prismaService.user.update({
      where: { email },
      data: { emailToken: newToken, emailTokenExpires: newTokenExpires },
    });

    // Send email
    await sendVerificationEmail(user.email, newToken);
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
