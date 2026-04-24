import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';

import { AccountService } from './account.service';

describe('AccountService', () => {
  let service: AccountService;
  let prismaService: {
    account: {
      findUnique: jest.Mock;
      create: jest.Mock;
      delete: jest.Mock;
    };
    transaction: {
      count: jest.Mock;
    };
  };

  const user = {
    sub: 'user-1',
    email: 'user@example.com',
    role: Role.USER,
  };

  const admin = {
    sub: 'admin-1',
    email: 'admin@example.com',
    role: Role.ADMIN,
  };

  beforeEach(() => {
    prismaService = {
      account: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      transaction: {
        count: jest.fn(),
      },
    };

    service = new AccountService(prismaService as never);
  });

  it('creates an account successfully', async () => {
    prismaService.account.findUnique.mockResolvedValue(null);
    prismaService.account.create.mockResolvedValue({
      id: 'account-1',
      userId: 'user-1',
      accountNumber: '1234567890',
      accountName: 'Primary Savings',
      balance: new Prisma.Decimal('0.00'),
      currency: 'IDR',
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      updatedAt: new Date('2025-01-01T00:00:00.000Z'),
    });

    const result = await service.create(user, {
      accountName: 'Primary Savings',
      currency: 'IDR',
    });

    expect(prismaService.account.create).toHaveBeenCalled();
    expect(result.accountName).toBe('Primary Savings');
    expect(result.userId).toBe('user-1');
    expect(result.balance).toBe('0.00');
  });

  it("prevents a user from accessing another user's account", async () => {
    prismaService.account.findUnique.mockResolvedValue({
      id: 'account-2',
      userId: 'other-user',
      accountNumber: '9999999999',
      accountName: 'Other Account',
      balance: new Prisma.Decimal('100.00'),
      currency: 'IDR',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(service.findOne(user, 'account-2')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it("allows an admin to access another user's account", async () => {
    prismaService.account.findUnique.mockResolvedValue({
      id: 'account-2',
      userId: 'other-user',
      accountNumber: '9999999999',
      accountName: 'Other Account',
      balance: new Prisma.Decimal('100.00'),
      currency: 'IDR',
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      updatedAt: new Date('2025-01-01T00:00:00.000Z'),
    });

    const result = await service.findOne(admin, 'account-2');

    expect(result).toEqual({
      id: 'account-2',
      userId: 'other-user',
      accountNumber: '9999999999',
      accountName: 'Other Account',
      balance: '100.00',
      currency: 'IDR',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    });
  });

  it('rejects account deletion when transactions already exist', async () => {
    prismaService.account.findUnique.mockResolvedValue({
      id: 'account-2',
      userId: 'user-1',
      accountNumber: '9999999999',
      accountName: 'Primary Savings',
      balance: new Prisma.Decimal('100.00'),
      currency: 'IDR',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prismaService.transaction.count.mockResolvedValue(2);

    await expect(service.remove(user, 'account-2')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prismaService.account.delete).not.toHaveBeenCalled();
  });

  it('deletes account when no related transactions exist', async () => {
    prismaService.account.findUnique.mockResolvedValue({
      id: 'account-3',
      userId: 'user-1',
      accountNumber: '1231231231',
      accountName: 'Empty Account',
      balance: new Prisma.Decimal('0.00'),
      currency: 'IDR',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prismaService.transaction.count.mockResolvedValue(0);

    await service.remove(user, 'account-3');

    expect(prismaService.account.delete).toHaveBeenCalledWith({
      where: { id: 'account-3' },
    });
  });
});
