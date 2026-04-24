import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

export class TransferDto {
  @ApiProperty({
    example: '45d48685-d4ae-447c-8d62-61df21889a90',
  })
  @IsUUID()
  fromAccountId!: string;

  @ApiProperty({
    example: '6ab0f8fc-fba3-48e1-b5d2-b8cb7bd5a09a',
  })
  @IsUUID()
  toAccountId!: string;

  @ApiProperty({
    example: '25000.00',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'amount must be a valid monetary value with up to 2 decimal places',
  })
  amount!: string;

  @ApiPropertyOptional({
    example: 'Transfer to friend',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
