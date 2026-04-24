import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';

import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: {
    verifyAsync: jest.Mock;
  };
  let configService: {
    getOrThrow: jest.Mock;
  };

  beforeEach(() => {
    jwtService = {
      verifyAsync: jest.fn(),
    };

    configService = {
      getOrThrow: jest.fn().mockReturnValue('test-secret'),
    };

    guard = new JwtAuthGuard(jwtService as never, configService as never);
  });

  it('rejects requests without bearer token', async () => {
    const request = {
      headers: {},
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    };

    await expect(guard.canActivate(context as never)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('accepts valid bearer token and attaches user', async () => {
    const request = {
      headers: {
        authorization: 'Bearer valid-token',
      },
      user: undefined,
    };

    jwtService.verifyAsync.mockResolvedValue({
      sub: 'user-1',
      email: 'jane@example.com',
      role: Role.USER,
    });

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    };

    await expect(guard.canActivate(context as never)).resolves.toBe(true);
    expect(request.user).toEqual({
      sub: 'user-1',
      email: 'jane@example.com',
      role: Role.USER,
    });
  });
});
