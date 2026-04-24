import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class UpdateAccountDto {
  @ApiPropertyOptional({
    example: 'Emergency Fund',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  accountName?: string;

  @ApiPropertyOptional({
    example: 'USD',
    minLength: 3,
    maxLength: 3,
  })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;
}
