import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import type { Options as PinoHttpOptions } from 'pino-http';
import { AuthModule } from './auth/auth.module';
import { WorkspacesModule } from './workspaces/workspaces.module';

const LOG_LEVELS: Record<string, string> = {
  prod: 'info',
  dev: 'debug'
};

const LOG_TRANSPORTS: Record<string, PinoHttpOptions['transport']> = {
  production: undefined, // raw logs
  development: { target: 'pino-pretty', options: { singleLine: true } },
}

@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const envName = configService.getOrThrow('NODE_ENV');
        return {
          pinoHttp: {
            transport: LOG_TRANSPORTS[envName],
            level: LOG_LEVELS[envName]
          }
        };
      }
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    AuthModule,
    WorkspacesModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
