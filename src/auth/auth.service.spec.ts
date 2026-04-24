import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };
  let jwtService: {
    signAsync: jest.Mock;
  };

  const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

  beforeEach(() => {
    prismaService = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-jwt-token'),
    };

    service = new AuthService(
      prismaService as unknown as PrismaService,
      jwtService as never,
    );
  });

  it('registers a user successfully', async () => {
    prismaService.user.findUnique.mockResolvedValue(null);
    mockedBcrypt.hash.mockResolvedValue('hashed-password' as never);
    prismaService.user.create.mockResolvedValue({
      id: 'user-1',
      email: 'jane@example.com',
      fullName: 'Jane Doe',
      hashedPassword: 'hashed-password',
      role: Role.USER,
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      updatedAt: new Date('2025-01-01T00:00:00.000Z'),
    });

    const result = await service.register({
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      password: 'password123',
    });

    expect(mockedBcrypt.hash).toHaveBeenCalledWith('password123', 10);
    expect(prismaService.user.create).toHaveBeenCalledWith({
      data: {
        email: 'jane@example.com',
        fullName: 'Jane Doe',
        hashedPassword: 'hashed-password',
      },
    });
    expect(result).toEqual({
      access_token: 'signed-jwt-token',
      user: {
        id: 'user-1',
        email: 'jane@example.com',
        fullName: 'Jane Doe',
        role: Role.USER,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    });
  });

  it('logs in successfully', async () => {
    prismaService.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'jane@example.com',
      fullName: 'Jane Doe',
      hashedPassword: 'hashed-password',
      role: Role.USER,
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      updatedAt: new Date('2025-01-01T00:00:00.000Z'),
    });
    mockedBcrypt.compare.mockResolvedValue(true as never);

    const result = await service.login({
      email: 'jane@example.com',
      password: 'password123',
    });

    expect(mockedBcrypt.compare).toHaveBeenCalledWith(
      'password123',
      'hashed-password',
    );
    expect(result.access_token).toBe('signed-jwt-token');
    expect(result.user.email).toBe('jane@example.com');
  });

  it('rejects duplicate email on register', async () => {
    prismaService.user.findUnique.mockResolvedValue({
      id: 'existing-user',
    });

    await expect(
      service.register({
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects invalid password on login', async () => {
    prismaService.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'jane@example.com',
      fullName: 'Jane Doe',
      hashedPassword: 'hashed-password',
      role: Role.USER,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockedBcrypt.compare.mockResolvedValue(false as never);

    await expect(
      service.login({
        email: 'jane@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
