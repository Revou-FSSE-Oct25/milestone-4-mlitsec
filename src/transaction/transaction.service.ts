import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Account, Prisma, Role, Transaction, TransactionType } from '@prisma/client';
import { randomUUID } from 'crypto';

import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { DepositDto } from './dto/deposit.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { TransferDto } from './dto/transfer.dto';
import { WithdrawDto } from './dto/withdraw.dto';

@Injectable()
export class TransactionService {
  constructor(private readonly prismaService: PrismaService) {}

  async deposit(
    authenticatedUser: AuthenticatedUser,
    depositDto: DepositDto,
  ): Promise<TransactionResponseDto> {
    const amount = this.parseAmount(depositDto.amount);

    const transaction = await this.prismaService.$transaction(
      async (tx) => {
        const account = await this.getAccessibleAccountOrThrow(
          tx,
          authenticatedUser,
          depositDto.accountId,
        );

        const balanceBefore = new Prisma.Decimal(account.balance);
        const balanceAfter = balanceBefore.plus(amount);

        await tx.account.update({
          where: { id: account.id },
          data: { balance: balanceAfter },
        });

        return tx.transaction.create({
          data: {
            accountId: account.id,
            type: TransactionType.DEPOSIT,
            amount,
            balanceBefore,
            balanceAfter,
            referenceNumber: this.generateReferenceNumber('DEP'),
            description: depositDto.description?.trim() || 'Deposit',
          },
          include: {
            account: true,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    return this.toTransactionResponse(transaction);
  }

  async withdraw(
    authenticatedUser: AuthenticatedUser,
    withdrawDto: WithdrawDto,
  ): Promise<TransactionResponseDto> {
    const amount = this.parseAmount(withdrawDto.amount);

    const transaction = await this.prismaService.$transaction(
      async (tx) => {
        const account = await this.getAccessibleAccountOrThrow(
          tx,
          authenticatedUser,
          withdrawDto.accountId,
        );

        const balanceBefore = new Prisma.Decimal(account.balance);

        if (balanceBefore.lessThan(amount)) {
          throw new BadRequestException('Insufficient balance');
        }

        const balanceAfter = balanceBefore.minus(amount);

        await tx.account.update({
          where: { id: account.id },
          data: { balance: balanceAfter },
        });

        return tx.transaction.create({
          data: {
            accountId: account.id,
            type: TransactionType.WITHDRAW,
            amount,
            balanceBefore,
            balanceAfter,
            referenceNumber: this.generateReferenceNumber('WDR'),
            description: withdrawDto.description?.trim() || 'Withdraw',
          },
          include: {
            account: true,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    return this.toTransactionResponse(transaction);
  }

  async transfer(
    authenticatedUser: AuthenticatedUser,
    transferDto: TransferDto,
  ): Promise<TransactionResponseDto> {
    if (transferDto.fromAccountId === transferDto.toAccountId) {
      throw new BadRequestException('Self-transfer is not allowed');
    }

    const amount = this.parseAmount(transferDto.amount);

    const outgoingTransaction = await this.prismaService.$transaction(
      async (tx) => {
        const sourceAccount = await this.getAccessibleAccountOrThrow(
          tx,
          authenticatedUser,
          transferDto.fromAccountId,
        );

        const targetAccount = await tx.account.findUnique({
          where: { id: transferDto.toAccountId },
        });

        if (!targetAccount) {
          throw new NotFoundException('Destination account not found');
        }

        const sourceBalanceBefore = new Prisma.Decimal(sourceAccount.balance);

        if (sourceBalanceBefore.lessThan(amount)) {
          throw new BadRequestException('Insufficient balance');
        }

        const targetBalanceBefore = new Prisma.Decimal(targetAccount.balance);
        const sourceBalanceAfter = sourceBalanceBefore.minus(amount);
        const targetBalanceAfter = targetBalanceBefore.plus(amount);
        const outgoingReference = this.generateReferenceNumber('TRF');
        const incomingReference = this.generateReferenceNumber('TRF');
        const description = transferDto.description?.trim();

        await tx.account.update({
          where: { id: sourceAccount.id },
          data: { balance: sourceBalanceAfter },
        });

        await tx.account.update({
          where: { id: targetAccount.id },
          data: { balance: targetBalanceAfter },
        });

        const createdOutgoingTransaction = await tx.transaction.create({
          data: {
            accountId: sourceAccount.id,
            type: TransactionType.TRANSFER,
            amount,
            balanceBefore: sourceBalanceBefore,
            balanceAfter: sourceBalanceAfter,
            referenceNumber: outgoingReference,
            description:
              description ||
              `Transfer to ${targetAccount.accountNumber}`,
          },
          include: {
            account: true,
          },
        });

        await tx.transaction.create({
          data: {
            accountId: targetAccount.id,
            type: TransactionType.TRANSFER,
            amount,
            balanceBefore: targetBalanceBefore,
            balanceAfter: targetBalanceAfter,
            referenceNumber: incomingReference,
            description:
              description ||
              `Transfer from ${sourceAccount.accountNumber}`,
          },
        });

        return createdOutgoingTransaction;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    return this.toTransactionResponse(outgoingTransaction);
  }

  async findAll(
    authenticatedUser: AuthenticatedUser,
  ): Promise<TransactionResponseDto[]> {
    const where =
      authenticatedUser.role === Role.ADMIN
        ? undefined
        : {
            account: {
              userId: authenticatedUser.sub,
            },
          };

    const transactions = await this.prismaService.transaction.findMany({
      where,
      include: {
        account: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return transactions.map((transaction) => this.toTransactionResponse(transaction));
  }

  async findOne(
    authenticatedUser: AuthenticatedUser,
    transactionId: string,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.prismaService.transaction.findUnique({
      where: { id: transactionId },
      include: {
        account: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    this.assertAccountAccess(authenticatedUser, transaction.account);

    return this.toTransactionResponse(transaction);
  }

  private parseAmount(rawAmount: string): Prisma.Decimal {
    try {
      const amount = new Prisma.Decimal(rawAmount);

      if (amount.lessThanOrEqualTo(0)) {
        throw new BadRequestException('Amount must be greater than zero');
      }

      return amount;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Invalid amount format');
    }
  }

  private async getAccessibleAccountOrThrow(
    tx: Prisma.TransactionClient,
    authenticatedUser: AuthenticatedUser,
    accountId: string,
  ): Promise<Account> {
    const account = await tx.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    this.assertAccountAccess(authenticatedUser, account);

    return account;
  }

  private assertAccountAccess(
    authenticatedUser: AuthenticatedUser,
    account: Pick<Account, 'userId'>,
  ): void {
    if (
      authenticatedUser.role !== Role.ADMIN &&
      account.userId !== authenticatedUser.sub
    ) {
      throw new ForbiddenException('You are not allowed to access this account');
    }
  }

  private generateReferenceNumber(prefix: string): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const suffix = randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();

    return `${prefix}-${timestamp}-${suffix}`;
  }

  private toTransactionResponse(
    transaction: Transaction & {
      account: Account;
    },
  ): TransactionResponseDto {
    return {
      id: transaction.id,
      accountId: transaction.accountId,
      accountNumber: transaction.account.accountNumber,
      type: transaction.type,
      amount: transaction.amount.toFixed(2),
      balanceBefore: transaction.balanceBefore.toFixed(2),
      balanceAfter: transaction.balanceAfter.toFixed(2),
      referenceNumber: transaction.referenceNumber,
      description: transaction.description,
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
    };
  }
}
