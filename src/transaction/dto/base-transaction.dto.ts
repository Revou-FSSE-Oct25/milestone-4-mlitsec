import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

export class BaseTransactionDto {
  @ApiProperty({
    example: '45d48685-d4ae-447c-8d62-61df21889a90',
  })
  @IsUUID()
  accountId!: string;

  @ApiProperty({
    example: '50000.00',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'amount must be a valid monetary value with up to 2 decimal places',
  })
  amount!: string;

  @ApiPropertyOptional({
    example: 'Initial deposit',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
