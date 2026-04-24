import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { DepositDto } from './dto/deposit.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { TransferDto } from './dto/transfer.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { TransactionService } from './transaction.service';

@ApiTags('Transactions')
@ApiBearerAuth('bearer')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post('deposit')
  @ApiOperation({ summary: 'Deposit money into an account' })
  @ApiBody({ type: DepositDto })
  @ApiResponse({ status: 201, type: TransactionResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  deposit(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Body() depositDto: DepositDto,
  ): Promise<TransactionResponseDto> {
    return this.transactionService.deposit(authenticatedUser, depositDto);
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Withdraw money from an account' })
  @ApiBody({ type: WithdrawDto })
  @ApiResponse({ status: 201, type: TransactionResponseDto })
  @ApiResponse({ status: 400, description: 'Insufficient balance or invalid amount' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  withdraw(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Body() withdrawDto: WithdrawDto,
  ): Promise<TransactionResponseDto> {
    return this.transactionService.withdraw(authenticatedUser, withdrawDto);
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Transfer money from one account to another' })
  @ApiBody({ type: TransferDto })
  @ApiResponse({ status: 201, type: TransactionResponseDto })
  @ApiResponse({ status: 400, description: 'Self-transfer, insufficient balance, or invalid amount' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Account or destination account not found' })
  transfer(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Body() transferDto: TransferDto,
  ): Promise<TransactionResponseDto> {
    return this.transactionService.transfer(authenticatedUser, transferDto);
  }

  @Get()
  @ApiOperation({ summary: 'List transactions visible to the authenticated user' })
  @ApiResponse({ status: 200, type: TransactionResponseDto, isArray: true })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
  ): Promise<TransactionResponseDto[]> {
    return this.transactionService.findAll(authenticatedUser);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a transaction by id' })
  @ApiResponse({ status: 200, type: TransactionResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  findOne(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) transactionId: string,
  ): Promise<TransactionResponseDto> {
    return this.transactionService.findOne(authenticatedUser, transactionId);
  }
}
