import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserProfileResponseDto } from './dto/user-profile-response.dto';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(): Promise<UserProfileResponseDto[]> {
    const users = await this.prismaService.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users.map((user) => this.toUserProfileResponse(user));
  }

  async findOne(userId: string): Promise<UserProfileResponseDto> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toUserProfileResponse(user);
  }

  async getProfile(userId: string): Promise<UserProfileResponseDto> {
    return this.findOne(userId);
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UserProfileResponseDto> {
    const currentUser = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    if (
      updateProfileDto.email &&
      updateProfileDto.email !== currentUser.email
    ) {
      const existingUser = await this.prismaService.user.findUnique({
        where: { email: updateProfileDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email is already registered');
      }
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: {
        fullName: updateProfileDto.fullName ?? currentUser.fullName,
        email: updateProfileDto.email ?? currentUser.email,
      },
    });

    return this.toUserProfileResponse(updatedUser);
  }

  private toUserProfileResponse(user: {
    id: string;
    email: string;
    fullName: string;
    role: UserProfileResponseDto['role'];
    createdAt: Date;
    updatedAt: Date;
  }): UserProfileResponseDto {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
