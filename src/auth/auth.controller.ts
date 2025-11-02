import { Body, Controller, Get, HttpCode, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './guards/local.guard';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import type { Response } from 'express';
import type { TokenPayload } from './token.payload';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {

  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(
    @CurrentUser() user: TokenPayload,
    @Res({ passthrough: true }) res: Response
  ) {
    return this.authService.assignTokens(user, res);
  }

  @Post('refresh-token')
  async refresh(@Req() req, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token;
    console.log("refreshToken", refreshToken)
    return this.authService.refreshTokens(refreshToken, res);
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', { httpOnly: true, path: '/' });
    res.clearCookie('refresh_token', { httpOnly: true, path: '/' });
    return { message: 'Logged out successfully' };
  }

  @Post('sign-up')
  async signup(@Body() dto: RegisterDto) {
    // Create user and send verification email
    await this.authService.signup(dto);
    return { message: 'Verification email sent successfully' };
  }

  // GET /auth/verify-email?token=
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    // Verify user by token and activate account
    await this.authService.verifyEmail(token);
    return { message: 'Email verified successfully. You can now log in.' };
  }

  @Post('resend-verification')
  @HttpCode(200)
  async resendVerificationEmail(@Body('email') email: string) {
    // Resend email verification with a new token
    await this.authService.retrySendVerificationEmail(email);
    return { message: 'Verification email sent successfully' };
  }
}
