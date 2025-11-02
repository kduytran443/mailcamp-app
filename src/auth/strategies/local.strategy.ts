import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { AuthService } from "../auth.service";
import { Injectable } from "@nestjs/common";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {

  constructor(private readonly authService: AuthService) {
    // Configure Passport Local:
    // usernameField: which field to read as "username" (default is "username")
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  };

  /*
    Called automatically when using this strategy.
    If valid → return user (added to req.user)
    If invalid → throw 401
  */
  async validate(email: string, password: string) {
    return this.authService.verifyUser(email, password);
  }
}
