import { MiddlewareConsumer, Module, NestModule, ValidationPipe } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthGuard } from './auth/auth.guard.js'
import { AuthModule } from './auth/auth.module.js'
import { PapeisGuard } from './auth/papeis.guard.js'
import { LoggerMiddleware } from './comum/logger.middleware.js'
import { RespostaInterceptor } from './comum/resposta.interceptor.js'
import { TodosErrosFilter } from './comum/todos-erros.filter.js'
import { GruposModule } from './grupos/grupos.module.js'
import { RecursosModule } from './recursos/recursos.module.js'
import { ReservasModule } from './reservas/reservas.module.js'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (c: ConfigService) => ({
        type: 'postgres' as const,
        host: c.getOrThrow<string>('DB_HOST'),
        port: Number(c.getOrThrow('DB_PORT')),
        username: c.getOrThrow<string>('DB_USER'),
        password: c.getOrThrow<string>('DB_PASS'),
        database: c.getOrThrow<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: c.get('NODE_ENV') === 'development',
      }),
    }),
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 60_000, limit: 300 }] }),
    AuthModule, GruposModule, RecursosModule, ReservasModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard }, // a ordem aqui é a ordem de execução
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: PapeisGuard },
    { provide: APP_PIPE, useValue: new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }) },
    { provide: APP_INTERCEPTOR, useClass: RespostaInterceptor },
    { provide: APP_FILTER, useClass: TodosErrosFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*path')
  }
}
