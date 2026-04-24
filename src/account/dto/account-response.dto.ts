import { ApiProperty } from '@nestjs/swagger';

export class AccountResponseDto {
  @ApiProperty({
    example: '45d48685-d4ae-447c-8d62-61df21889a90',
  })
  id!: string;

  @ApiProperty({
    example: '4f0bbf9a-62b9-4ab7-a8a5-bf6eaf7aa111',
  })
  userId!: string;

  @ApiProperty({
    example: '1234567890',
  })
  accountNumber!: string;

  @ApiProperty({
    example: 'Primary Savings',
  })
  accountName!: string;

  @ApiProperty({
    example: '100000.00',
  })
  balance!: string;

  @ApiProperty({
    example: 'IDR',
  })
  currency!: string;

  @ApiProperty({
    example: '2025-09-01T12:00:00.000Z',
  })
  createdAt!: string;

  @ApiProperty({
    example: '2025-09-01T12:00:00.000Z',
  })
  updatedAt!: string;
}
