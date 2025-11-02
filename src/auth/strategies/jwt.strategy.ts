import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import { TokenPayload } from "../token.payload";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {

  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          return req?.cookies?.access_token || null;
        },
      ]),
      secretOrKey: config.getOrThrow('JWT_SECRET'),
    });
  }

  validate(payload: TokenPayload) {
    return payload;
  }  
}
