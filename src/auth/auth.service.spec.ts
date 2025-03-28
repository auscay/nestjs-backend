import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';

// Mock implementations
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  }
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-token')
};

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService }
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a user', async () => {
      const registerInput = {
        email: 'test@example.com',
        password: 'password123',
        biometricKey: 'biometric123'
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: '1',
        email: registerInput.email,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      jest.spyOn(bcrypt, 'hash').mockImplementation((data) => Promise.resolve(`hashed-${data}`));

      const result = await service.register(registerInput);

      expect(result).toHaveProperty('id');
      expect(result.email).toBe(registerInput.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(registerInput.password, 12);
      expect(bcrypt.hash).toHaveBeenCalledWith(registerInput.biometricKey, 10);
    });

    it('should throw ConflictException if email exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'test@example.com' });

      await expect(service.register({
        email: 'test@example.com',
        password: 'password123'
      })).rejects.toThrow(ConflictException);
    });
  });

  describe('validateUser', () => {
    it('should return user if credentials are valid', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashed-password'
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password123');
      expect(result).toEqual(expect.objectContaining({
        id: mockUser.id,
        email: mockUser.email
      }));
    });

    it('should return null if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const result = await service.validateUser('nonexistent@example.com', 'password123');
      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashed-password'
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrong-password');
      expect(result).toBeNull();
    });
  });

  describe('validateBiometricKey', () => {
    it('should return user if biometric key is valid', async () => {
      const mockUsers = [{
        id: '1',
        email: 'test@example.com',
        biometricKey: 'hashed-biometric123'
      }];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      jest.spyOn(bcrypt, 'compare').mockImplementation((key, hashedKey) => 
        Promise.resolve(hashedKey === `hashed-${key}`)
      );

      const result = await service.validateBiometricKey('biometric123');
      expect(result).toEqual(expect.objectContaining({
        id: mockUsers[0].id,
        email: mockUsers[0].email
      }));
    });

    it('should throw UnauthorizedException if biometric key is invalid', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      await expect(service.validateBiometricKey('invalid-key'))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getCurrentUser', () => {
    it('should return user if found', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getCurrentUser('1');
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getCurrentUser('nonexistent-id'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('generateToken', () => {
    it('should generate a JWT token', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await service.generateToken(mockUser);
      expect(result).toBe('mock-token');
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email
      });
    });
  });
});