import { ApiProperty } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';

export class TransactionResponseDto {
  @ApiProperty({
    example: '0d828a17-d6e2-47b2-b7c4-f58f27f2794d',
  })
  id!: string;

  @ApiProperty({
    example: '45d48685-d4ae-447c-8d62-61df21889a90',
  })
  accountId!: string;

  @ApiProperty({
    example: '1234567890',
  })
  accountNumber!: string;

  @ApiProperty({
    enum: TransactionType,
    example: TransactionType.DEPOSIT,
  })
  type!: TransactionType;

  @ApiProperty({
    example: '50000.00',
  })
  amount!: string;

  @ApiProperty({
    example: '100000.00',
  })
  balanceBefore!: string;

  @ApiProperty({
    example: '150000.00',
  })
  balanceAfter!: string;

  @ApiProperty({
    example: 'DEP-MF3Q7AVH-9A7B1C2D',
  })
  referenceNumber!: string;

  @ApiProperty({
    example: 'Initial deposit',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({
    example: '2025-09-01T12:00:00.000Z',
  })
  createdAt!: string;

  @ApiProperty({
    example: '2025-09-01T12:00:00.000Z',
  })
  updatedAt!: string;
}
