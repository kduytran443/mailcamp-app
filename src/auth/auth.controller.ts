import { Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './guards/local.guard';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import type { Response } from 'express';
import type { TokenPayload } from './token.payload';

@Controller('auth')
export class AuthController {

  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(
    @CurrentUser() user: TokenPayload,
    @Res({ passthrough: true }) res: Response
  ) {
    return this.authService.login(user, res);
  }

  @Post('refresh-token')
  async refresh(@Req() req, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token;
    console.log("refreshToken", refreshToken)
    return this.authService.refreshTokens(refreshToken, res);
  }
}
