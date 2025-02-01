import { Body, Controller, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Request, Response } from 'express';
import { CookieService } from '../core/cookie/cookie.service';
import { AuthenticationService } from './authentication.service';
import { LoginRequestDto } from './dtos/login-request.dto';
import { RegisterRequestDto } from './dtos/register-request.dto';
import { RegisterResponseDto } from './dtos/register-response.dto';

@Controller('auth')
export class AuthenticationController {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly cookieService: CookieService,
  ) {}

  @Post('/register')
  async register(@Body() registerRequest: RegisterRequestDto): Promise<RegisterResponseDto> {
    const account = await this.authenticationService.register(registerRequest);
    return plainToInstance(RegisterResponseDto, account);
  }

  @Post('/login')
  async login(
    @Body() loginRequest: LoginRequestDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const { jwt, jwtExpires, jwtRefresh, jwtRefreshExpires } =
      await this.authenticationService.login(loginRequest);
    this.cookieService.setJwtCookie(response, jwt, jwtExpires);
    this.cookieService.setJwtRefreshCookie(response, jwtRefresh, jwtRefreshExpires);
  }

  @Post('/logout')
  async logout(@Res({ passthrough: true }) response: Response): Promise<void> {
    this.cookieService.unsetJwtCookie(response);
    this.cookieService.unsetJwtRefreshCookie(response);
  }

  @Post('/refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    if (!request.cookies.jwtRefresh) {
      this.cookieService.unsetJwtRefreshCookie(response);
      throw new UnauthorizedException();
    }
    const { jwt, jwtExpires, jwtRefresh, jwtRefreshExpires } =
      await this.authenticationService.refresh({ jwtRefresh: request.cookies.jwtRefresh });
    this.cookieService.setJwtCookie(response, jwt, jwtExpires);
    this.cookieService.setJwtRefreshCookie(response, jwtRefresh, jwtRefreshExpires);
  }
}
