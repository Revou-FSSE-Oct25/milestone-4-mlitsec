import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateAccountDto {
  @ApiProperty({
    example: 'Primary Savings',
  })
  @IsString()
  @IsNotEmpty()
  accountName!: string;

  @ApiPropertyOptional({
    example: 'IDR',
    minLength: 3,
    maxLength: 3,
  })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;
}
