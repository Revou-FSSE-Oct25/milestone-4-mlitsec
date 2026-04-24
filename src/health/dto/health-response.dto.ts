import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({
    example: 'ok',
  })
  status!: string;

  @ApiProperty({
    example: '2025-09-01T12:00:00.000Z',
  })
  timestamp!: string;

  @ApiProperty({
    example: 'RevoBank API',
  })
  service!: string;
}
