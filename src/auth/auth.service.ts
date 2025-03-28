import { Injectable, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterInput } from './dto/register.input';
import { User } from '../models/';
import { LoginInput } from './dto';

@Injectable()
export class AuthService {

    constructor(private readonly prisma: PrismaService,
        private readonly jwtService: JwtService
    ) { 

    }

    // Token generation function
    async generateToken(user: User) {
        const payload = {
        sub: user.id,    
        email: user.email,
        };
        
        return this.jwtService.sign(payload);
    }


    async register(input: RegisterInput) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: input.email },
          });

          if (existingUser) {
            throw new ConflictException('Email already in use');
          }

          const hashedPassword = await bcrypt.hash(input.password, 12);

          // Hash biometric key if provided
          let hashedBiometricKey: string | null = null;
          if (input.biometricKey) {
              hashedBiometricKey = await bcrypt.hash(input.biometricKey, 10);
          }

          const newUser = await this.prisma.user.create({
            data: {
              email: input.email,
              password: hashedPassword,
              biometricKey: hashedBiometricKey
            },
            select: { // Explicitly select fields
              id: true,
              email: true,
              createdAt: true,
              updatedAt: true
            }
          });

          return newUser;
    } 

    async getCurrentUser(userId: string): Promise<User> {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: {  
            id: true,
            email: true,
            createdAt: true,
            updatedAt: true,
          }
        });
    
        if (!user) {
          throw new NotFoundException('User not found');
        }
    
        return user;
    }

    async validateUser(email: string, password: string): Promise<User | null> {
        const user = await this.prisma.user.findUnique({ 
          where: { email },
          select: { id: true, email: true, password: true, createdAt: true, updatedAt: true }
        });
    
        if (!user) return null;
    
        const isValid = await bcrypt.compare(password, user.password);
        return isValid ? user : null;
    }

    async validateBiometricKey(biometricKey: string): Promise<User> {
        const users = await this.prisma.user.findMany({
            where: { 
                biometricKey: { not: null } 
            },
            select: {
                id: true,
                email: true,
                biometricKey: true,
                createdAt: true,
                updatedAt: true
            }
        });
    
        
        for (const user of users) {
            if (await bcrypt.compare(biometricKey, user.biometricKey!)) {
                return user
            }
        }
    
        throw new UnauthorizedException('Invalid biometric credentials');
    }
    
}
