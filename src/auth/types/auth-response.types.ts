import { ObjectType, Field } from '@nestjs/graphql';
import { User } from '../../models';

@ObjectType()
export class AuthResponse {
  @Field(() => Boolean)
  success: boolean;

  @Field(() => String)
  message: string;

  @Field(() => User, { nullable: true })
  data?: User;

  @Field(() => String, { nullable: true })
  accessToken?: string;
}