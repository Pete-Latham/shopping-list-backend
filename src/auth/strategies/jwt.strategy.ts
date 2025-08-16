import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { JwtPayload, AuthUser } from '../dto/auth.dto';
import { InfisicalConfigService } from '../../config/infisical.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private jwtSecret: string;

  constructor(
    private authService: AuthService,
    private infisicalConfigService: InfisicalConfigService,
  ) {
    // We'll initialize the secret asynchronously in onModuleInit
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: async (request, rawJwtToken, done) => {
        try {
          if (!this.jwtSecret) {
            const secrets = await this.infisicalConfigService.getSecrets();
            this.jwtSecret = secrets.jwtSecret;
          }
          done(null, this.jwtSecret);
        } catch (error) {
          done(error);
        }
      },
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.authService.validateUser(payload);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
