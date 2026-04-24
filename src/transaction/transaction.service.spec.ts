import { BadRequestException } from '@nestjs/common';
import { Prisma, Role, TransactionType } from '@prisma/client';

import { TransactionService } from './transaction.service';

describe('TransactionService', () => {
  let service: TransactionService;
  let prismaService: {
    $transaction: jest.Mock;
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

  const sourceAccount = {
    id: 'account-1',
    userId: 'user-1',
    accountNumber: '1000000001',
    accountName: 'Primary',
    balance: new Prisma.Decimal('500.00'),
    currency: 'IDR',
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    prismaService = {
      $transaction: jest.fn(),
    };

    service = new TransactionService(prismaService as never);
  });

  it('deposits successfully', async () => {
    const tx = {
      account: {
        findUnique: jest.fn().mockResolvedValue(sourceAccount),
        update: jest.fn(),
      },
      transaction: {
        create: jest.fn().mockResolvedValue({
          id: 'tx-1',
          accountId: sourceAccount.id,
          type: TransactionType.DEPOSIT,
          amount: new Prisma.Decimal('100.00'),
          balanceBefore: new Prisma.Decimal('500.00'),
          balanceAfter: new Prisma.Decimal('600.00'),
          referenceNumber: 'DEP-REF-1',
          description: 'Deposit',
          createdAt: new Date('2025-01-01T00:00:00.000Z'),
          updatedAt: new Date('2025-01-01T00:00:00.000Z'),
          account: sourceAccount,
        }),
      },
    };

    prismaService.$transaction.mockImplementation((callback: any) => callback(tx));

    const result = await service.deposit(user, {
      accountId: sourceAccount.id,
      amount: '100.00',
      description: 'Deposit',
    });

    expect(tx.account.update).toHaveBeenCalledWith({
      where: { id: sourceAccount.id },
      data: { balance: new Prisma.Decimal('600.00') },
    });
    expect(result.type).toBe(TransactionType.DEPOSIT);
    expect(result.balanceAfter).toBe('600.00');
  });

  it('withdraws successfully', async () => {
    const tx = {
      account: {
        findUnique: jest.fn().mockResolvedValue(sourceAccount),
        update: jest.fn(),
      },
      transaction: {
        create: jest.fn().mockResolvedValue({
          id: 'tx-2',
          accountId: sourceAccount.id,
          type: TransactionType.WITHDRAW,
          amount: new Prisma.Decimal('200.00'),
          balanceBefore: new Prisma.Decimal('500.00'),
          balanceAfter: new Prisma.Decimal('300.00'),
          referenceNumber: 'WDR-REF-1',
          description: 'Withdraw',
          createdAt: new Date('2025-01-01T00:00:00.000Z'),
          updatedAt: new Date('2025-01-01T00:00:00.000Z'),
          account: sourceAccount,
        }),
      },
    };

    prismaService.$transaction.mockImplementation((callback: any) => callback(tx));

    const result = await service.withdraw(user, {
      accountId: sourceAccount.id,
      amount: '200.00',
      description: 'Withdraw',
    });

    expect(result.type).toBe(TransactionType.WITHDRAW);
    expect(result.balanceAfter).toBe('300.00');
  });

  it('rejects withdraw when balance is insufficient', async () => {
    const tx = {
      account: {
        findUnique: jest.fn().mockResolvedValue(sourceAccount),
        update: jest.fn(),
      },
      transaction: {
        create: jest.fn(),
      },
    };

    prismaService.$transaction.mockImplementation((callback: any) => callback(tx));

    await expect(
      service.withdraw(user, {
        accountId: sourceAccount.id,
        amount: '600.00',
        description: 'Too much',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('transfers successfully', async () => {
    const destinationAccount = {
      ...sourceAccount,
      id: 'account-2',
      userId: 'other-user',
      accountNumber: '2000000001',
      balance: new Prisma.Decimal('150.00'),
    };

    const tx = {
      account: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce(sourceAccount)
          .mockResolvedValueOnce(destinationAccount),
        update: jest.fn(),
      },
      transaction: {
        create: jest
          .fn()
          .mockResolvedValueOnce({
            id: 'tx-3',
            accountId: sourceAccount.id,
            type: TransactionType.TRANSFER,
            amount: new Prisma.Decimal('50.00'),
            balanceBefore: new Prisma.Decimal('500.00'),
            balanceAfter: new Prisma.Decimal('450.00'),
            referenceNumber: 'TRF-REF-1',
            description: 'Transfer to 2000000001',
            createdAt: new Date('2025-01-01T00:00:00.000Z'),
            updatedAt: new Date('2025-01-01T00:00:00.000Z'),
            account: sourceAccount,
          })
          .mockResolvedValueOnce({
            id: 'tx-4',
          }),
      },
    };

    prismaService.$transaction.mockImplementation((callback: any) => callback(tx));

    const result = await service.transfer(user, {
      fromAccountId: sourceAccount.id,
      toAccountId: destinationAccount.id,
      amount: '50.00',
      description: '',
    });

    expect(tx.account.update).toHaveBeenNthCalledWith(1, {
      where: { id: sourceAccount.id },
      data: { balance: new Prisma.Decimal('450.00') },
    });
    expect(tx.account.update).toHaveBeenNthCalledWith(2, {
      where: { id: destinationAccount.id },
      data: { balance: new Prisma.Decimal('200.00') },
    });
    expect(result.type).toBe(TransactionType.TRANSFER);
    expect(result.balanceAfter).toBe('450.00');
  });

  it('rejects self-transfer', async () => {
    await expect(
      service.transfer(user, {
        fromAccountId: 'account-1',
        toAccountId: 'account-1',
        amount: '50.00',
        description: 'Self transfer',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("allows an admin to access transaction data beyond their own account", async () => {
    const foreignAccount = {
      ...sourceAccount,
      id: 'account-9',
      userId: 'other-user',
      accountNumber: '9000000009',
    };

    prismaService.$transaction.mockReset();
    (prismaService as any).transaction = {
      findUnique: jest.fn().mockResolvedValue({
        id: 'tx-admin-1',
        accountId: foreignAccount.id,
        type: TransactionType.DEPOSIT,
        amount: new Prisma.Decimal('75.00'),
        balanceBefore: new Prisma.Decimal('25.00'),
        balanceAfter: new Prisma.Decimal('100.00'),
        referenceNumber: 'DEP-ADMIN-1',
        description: 'Admin-visible transaction',
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
        account: foreignAccount,
      }),
    };

    const result = await service.findOne(admin, 'tx-admin-1');

    expect((prismaService as any).transaction.findUnique).toHaveBeenCalledWith({
      where: { id: 'tx-admin-1' },
      include: {
        account: true,
      },
    });
    expect(result).toEqual({
      id: 'tx-admin-1',
      accountId: 'account-9',
      accountNumber: '9000000009',
      type: TransactionType.DEPOSIT,
      amount: '75.00',
      balanceBefore: '25.00',
      balanceAfter: '100.00',
      referenceNumber: 'DEP-ADMIN-1',
      description: 'Admin-visible transaction',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    });
  });
});
