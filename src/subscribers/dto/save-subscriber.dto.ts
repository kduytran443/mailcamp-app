import { IsEmail, IsOptional, IsString, IsArray } from 'class-validator';
import { CreateSubscriberDto } from './create-subscriber.dto';

export class SaveSubscriberDto extends CreateSubscriberDto {}
