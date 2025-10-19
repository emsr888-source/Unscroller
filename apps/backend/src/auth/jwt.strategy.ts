import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Use JWT secret from Supabase
      secretOrKey: process.env.SUPABASE_JWT_SECRET,
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    // Payload from Supabase JWT
    const user = await this.authService.findOrCreateUser(payload.sub, payload.email);
    
    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
