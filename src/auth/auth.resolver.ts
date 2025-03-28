import { Mutation, Resolver, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Query } from '@nestjs/graphql';
import { RegisterInput, LoginInput } from './dto';
import { AuthService } from './auth.service';
import { AuthResponse } from './types/auth-response.types';
import { User } from '../models';
import { GqlAuthGuard } from './guards/gql-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';



@Resolver()
export class AuthResolver {

    constructor(
        private readonly authService: AuthService,
    ) {}

    @Mutation(() => AuthResponse) 
    async register(@Args('input') input: RegisterInput): Promise<AuthResponse> {
        try {
          const newUser = await this.authService.register(input);
          
          if (!newUser) {
            throw new Error('Failed to register user');
          }

          return {
            success: true,
            message: 'User registered successfully',
            data: {
              id: newUser.id,
              email: newUser.email,
              createdAt: newUser.createdAt,
              updatedAt: newUser.updatedAt
            }
          };
        } catch (error) {
          return {
            success: false,
            message: error.message,
            data: null
          };
        }
    }

    @Mutation(() => AuthResponse)
    async login(@Args('input') input: LoginInput): Promise<AuthResponse> {
        try {
            const user = await this.authService.validateUser(input.email, input.password);


            if (!user) {
            throw new Error('Invalid email or password');
            }

            const accessToken = await this.authService.generateToken(user);

            if (!accessToken) {
            throw new Error('Failed to generate access token');
            }
            
          return {
            success: true,
            message: 'User logged in successfully',
            data: {
              id: user.id,
              email: user.email,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            accessToken: accessToken,
          };
        } catch (error) {
          return {
            success: false,
            message: error.message,
            data: null
          };
        }
    }

    // Biometric Login
    @Mutation(() => AuthResponse)
    async biometricLogin(@Args('biometricKey') biometricKey: string): Promise<AuthResponse> {
        try {

            const user = await this.authService.validateBiometricKey(biometricKey);
            
            if (!user) {
                throw new Error('Invalid biometric credentials');
            }

            const accessToken = await this.authService.generateToken(user);

            return {
                success: true,
                message: 'Biometric login successful',
                data: {
                    id: user.id,
                    email: user.email,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                },
                accessToken
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Biometric authentication failed',
                data: null
            };
        }
    }

    @Query(() => User)
    @UseGuards(GqlAuthGuard)
    async me(@CurrentUser() user: User) {
        return this.authService.getCurrentUser(user.id);
    }
    
}
