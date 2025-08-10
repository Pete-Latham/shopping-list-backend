import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from './entities/user.entity';
import { RegisterDto, LoginDto, ChangePasswordDto, AuthUser, JwtPayload, LoginResponse, RefreshResponse } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthUser> {
    const { email, username, password } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [{ email }, { username }]
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException('Email already exists');
      }
      if (existingUser.username === username) {
        throw new ConflictException('Username already exists');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = this.userRepository.create({
      email,
      username,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);

    return {
      id: savedUser.id,
      email: savedUser.email,
      username: savedUser.username,
    };
  }

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const { usernameOrEmail, password } = loginDto;
    
    // Find user by email or username
    const user = await this.userRepository.findOne({
      where: [{ email: usernameOrEmail }, { username: usernameOrEmail }]
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    const access_token = this.jwtService.sign(payload);
    const refresh_token = await this.generateRefreshToken(user.id);

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    };
  }

  async validateUser(payload: JwtPayload): Promise<AuthUser | null> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub, isActive: true }
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
    };
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto): Promise<void> {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await this.userRepository.update(userId, { password: hashedNewPassword });
  }

  async getProfile(userId: number): Promise<AuthUser> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
    };
  }

  async generateRefreshToken(userId: number): Promise<string> {
    // Generate a secure random token
    const refreshToken = crypto.randomBytes(64).toString('hex');
    
    // Calculate expiry date
    const expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
    const expiryDate = new Date();
    
    // Parse expiry string (e.g., '7d', '24h', '30m')
    if (expiresIn.endsWith('d')) {
      expiryDate.setDate(expiryDate.getDate() + parseInt(expiresIn.slice(0, -1)));
    } else if (expiresIn.endsWith('h')) {
      expiryDate.setHours(expiryDate.getHours() + parseInt(expiresIn.slice(0, -1)));
    } else if (expiresIn.endsWith('m')) {
      expiryDate.setMinutes(expiryDate.getMinutes() + parseInt(expiresIn.slice(0, -1)));
    } else {
      // Default to 7 days if format is unknown
      expiryDate.setDate(expiryDate.getDate() + 7);
    }

    // Hash the token before storing
    const hashedToken = await bcrypt.hash(refreshToken, 12);
    
    // Store hashed token in database
    await this.userRepository.update(userId, {
      refreshToken: hashedToken,
      refreshTokenExpiresAt: expiryDate,
    });

    return refreshToken;
  }

  async refreshTokens(refreshToken: string): Promise<RefreshResponse> {
    // Find all active users that have refresh tokens
    const users = await this.userRepository.find({
      where: {
        isActive: true,
      },
    });

    let user: User | null = null;
    
    // Check each user's hashed refresh token
    for (const u of users) {
      if (u.refreshToken && u.refreshTokenExpiresAt && u.refreshTokenExpiresAt > new Date()) {
        const isValidToken = await bcrypt.compare(refreshToken, u.refreshToken);
        if (isValidToken) {
          user = u;
          break;
        }
      }
    }

    if (!user) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Generate new tokens
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    const access_token = this.jwtService.sign(payload);
    const new_refresh_token = await this.generateRefreshToken(user.id);

    return {
      access_token,
      refresh_token: new_refresh_token,
    };
  }

  async revokeRefreshToken(userId: number): Promise<void> {
    await this.userRepository.update(userId, {
      refreshToken: null,
      refreshTokenExpiresAt: null,
    });
  }
}
