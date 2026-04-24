import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class AuthUserDto {
  @ApiProperty({
    example: '4f0bbf9a-62b9-4ab7-a8a5-bf6eaf7aa111',
  })
  id!: string;

  @ApiProperty({
    example: 'jane@example.com',
  })
  email!: string;

  @ApiProperty({
    example: 'Jane Doe',
  })
  fullName!: string;

  @ApiProperty({
    enum: Role,
    example: Role.USER,
  })
  role!: Role;

  @ApiProperty({
    example: '2025-09-01T12:00:00.000Z',
  })
  createdAt!: string;

  @ApiProperty({
    example: '2025-09-01T12:00:00.000Z',
  })
  updatedAt!: string;
}
