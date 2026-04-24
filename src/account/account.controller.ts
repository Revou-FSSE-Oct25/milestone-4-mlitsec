import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { AccountResponseDto } from './dto/account-response.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@ApiTags('Accounts')
@ApiBearerAuth('bearer')
@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new bank account for the authenticated user' })
  @ApiBody({ type: CreateAccountDto })
  @ApiResponse({ status: 201, type: AccountResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Body() createAccountDto: CreateAccountDto,
  ): Promise<AccountResponseDto> {
    return this.accountService.create(authenticatedUser, createAccountDto);
  }

  @Get()
  @ApiOperation({ summary: 'List accounts visible to the authenticated user' })
  @ApiResponse({ status: 200, type: AccountResponseDto, isArray: true })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
  ): Promise<AccountResponseDto[]> {
    return this.accountService.findAll(authenticatedUser);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an account by id' })
  @ApiResponse({ status: 200, type: AccountResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  findOne(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) accountId: string,
  ): Promise<AccountResponseDto> {
    return this.accountService.findOne(authenticatedUser, accountId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update account name or currency' })
  @ApiBody({ type: UpdateAccountDto })
  @ApiResponse({ status: 200, type: AccountResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  update(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) accountId: string,
    @Body() updateAccountDto: UpdateAccountDto,
  ): Promise<AccountResponseDto> {
    return this.accountService.update(authenticatedUser, accountId, updateAccountDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an account by id' })
  @ApiResponse({ status: 204, description: 'Account deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async remove(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) accountId: string,
  ): Promise<void> {
    await this.accountService.remove(authenticatedUser, accountId);
  }
}
