import { Controller, Post, Get, Body, UseGuards, Request, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto, LoginDto, ChangePasswordDto, RefreshTokenDto, LoginResponse, AuthUser, RefreshResponse } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Get('status')
  getAuthStatus() {
    const authEnabledStr = this.configService.get<string>('AUTH_ENABLED', 'true');
    const authEnabled = authEnabledStr.toLowerCase() === 'true';
    return {
      authEnabled,
      message: authEnabled ? 'Authentication is enabled' : 'Authentication is disabled (development mode)'
    };
  }

  @Post('register')
  async register(@Body(ValidationPipe) registerDto: RegisterDto): Promise<AuthUser> {
    const authEnabled = this.configService.get<boolean>('AUTH_ENABLED', true);
    
    if (!authEnabled) {
      throw new Error('Registration is not available when authentication is disabled');
    }

    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body(ValidationPipe) loginDto: LoginDto): Promise<LoginResponse> {
    const authEnabled = this.configService.get<boolean>('AUTH_ENABLED', true);
    
    if (!authEnabled) {
      // Return a mock response when auth is disabled
      return {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
        user: { id: 1, email: 'dev@example.com', username: 'dev' }
      };
    }

    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req): Promise<AuthUser> {
    const authEnabled = this.configService.get<boolean>('AUTH_ENABLED', true);
    
    if (!authEnabled) {
      return { id: 1, email: 'dev@example.com', username: 'dev' };
    }

    return this.authService.getProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @Request() req,
    @Body(ValidationPipe) changePasswordDto: ChangePasswordDto
  ): Promise<{ message: string }> {
    const authEnabled = this.configService.get<boolean>('AUTH_ENABLED', true);
    
    if (!authEnabled) {
      throw new Error('Password change is not available when authentication is disabled');
    }

    await this.authService.changePassword(req.user.id, changePasswordDto);
    return { message: 'Password changed successfully' };
  }

  @Post('refresh')
  async refreshTokens(@Body(ValidationPipe) refreshTokenDto: RefreshTokenDto): Promise<RefreshResponse> {
    const authEnabled = this.configService.get<boolean>('AUTH_ENABLED', true);
    
    if (!authEnabled) {
      throw new Error('Token refresh is not available when authentication is disabled');
    }

    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req): Promise<{ message: string }> {
    const authEnabled = this.configService.get<boolean>('AUTH_ENABLED', true);
    
    if (!authEnabled) {
      return { message: 'Logged out successfully' };
    }

    await this.authService.revokeRefreshToken(req.user.id);
    return { message: 'Logged out successfully' };
  }
}
