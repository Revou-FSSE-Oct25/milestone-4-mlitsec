import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Account, Prisma, Role } from '@prisma/client';
import { randomInt } from 'crypto';

import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { AccountResponseDto } from './dto/account-response.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountService {
  private static readonly ACCOUNT_NUMBER_LENGTH = 10;
  private static readonly MAX_GENERATION_ATTEMPTS = 10;

  constructor(private readonly prismaService: PrismaService) {}

  async create(
    authenticatedUser: AuthenticatedUser,
    createAccountDto: CreateAccountDto,
  ): Promise<AccountResponseDto> {
    const accountNumber = await this.generateUniqueAccountNumber();

    const account = await this.prismaService.account.create({
      data: {
        userId: authenticatedUser.sub,
        accountName: createAccountDto.accountName,
        currency: createAccountDto.currency ?? 'IDR',
        accountNumber,
      },
    });

    return this.toAccountResponse(account);
  }

  async findAll(authenticatedUser: AuthenticatedUser): Promise<AccountResponseDto[]> {
    const where =
      authenticatedUser.role === Role.ADMIN
        ? undefined
        : { userId: authenticatedUser.sub };

    const accounts = await this.prismaService.account.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return accounts.map((account) => this.toAccountResponse(account));
  }

  async findOne(
    authenticatedUser: AuthenticatedUser,
    accountId: string,
  ): Promise<AccountResponseDto> {
    const account = await this.getAccessibleAccountOrThrow(authenticatedUser, accountId);
    return this.toAccountResponse(account);
  }

  async update(
    authenticatedUser: AuthenticatedUser,
    accountId: string,
    updateAccountDto: UpdateAccountDto,
  ): Promise<AccountResponseDto> {
    await this.getAccessibleAccountOrThrow(authenticatedUser, accountId);

    const updatedAccount = await this.prismaService.account.update({
      where: { id: accountId },
      data: {
        accountName: updateAccountDto.accountName,
        currency: updateAccountDto.currency,
      },
    });

    return this.toAccountResponse(updatedAccount);
  }

  async remove(authenticatedUser: AuthenticatedUser, accountId: string): Promise<void> {
    await this.getAccessibleAccountOrThrow(authenticatedUser, accountId);

    const relatedTransactionCount = await this.prismaService.transaction.count({
      where: { accountId },
    });

    if (relatedTransactionCount > 0) {
      throw new BadRequestException(
        'Account cannot be deleted because it already has transactions',
      );
    }

    await this.prismaService.account.delete({
      where: { id: accountId },
    });
  }

  private async getAccessibleAccountOrThrow(
    authenticatedUser: AuthenticatedUser,
    accountId: string,
  ): Promise<Account> {
    const account = await this.prismaService.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (
      authenticatedUser.role !== Role.ADMIN &&
      account.userId !== authenticatedUser.sub
    ) {
      throw new ForbiddenException('You are not allowed to access this account');
    }

    return account;
  }

  private async generateUniqueAccountNumber(): Promise<string> {
    for (let attempt = 0; attempt < AccountService.MAX_GENERATION_ATTEMPTS; attempt += 1) {
      const candidate = this.generateAccountNumberCandidate();
      const existingAccount = await this.prismaService.account.findUnique({
        where: { accountNumber: candidate },
      });

      if (!existingAccount) {
        return candidate;
      }
    }

    throw new InternalServerErrorException('Failed to generate a unique account number');
  }

  private generateAccountNumberCandidate(): string {
    let accountNumber = '';

    for (let index = 0; index < AccountService.ACCOUNT_NUMBER_LENGTH; index += 1) {
      accountNumber += randomInt(0, 10).toString();
    }

    return accountNumber;
  }

  private toAccountResponse(account: Account): AccountResponseDto {
    return {
      id: account.id,
      userId: account.userId,
      accountNumber: account.accountNumber,
      accountName: account.accountName,
      balance: this.toMoneyString(account.balance),
      currency: account.currency,
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
    };
  }

  private toMoneyString(value: Prisma.Decimal): string {
    return value.toFixed(2);
  }
}
