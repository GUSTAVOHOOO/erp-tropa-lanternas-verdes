import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { JwtModule } from '@nestjs/jwt'
import { ThrottlerModule } from '@nestjs/throttler'
import { validarAmbiente } from '../config/ambiente.js'
import { DatabaseModule } from '../database/database.module.js'
import { AuthController } from './auth.controller.js'
import { AuthService } from './auth.service.js'
import { JwtGuard } from './jwt.guard.js'
import { PapeisGuard } from './papeis.guard.js'
import { SenhaService } from './senha.service.js'

@Module({
  imports: [
    DatabaseModule,
    JwtModule.registerAsync({
      useFactory: () => {
        const ambiente = validarAmbiente(process.env)
        return {
          secret: ambiente.JWT_SECRET,
          signOptions: { algorithm: 'HS256' as const, expiresIn: '8h' as const },
          verifyOptions: { algorithms: ['HS256'] },
        }
      },
    }),
    ThrottlerModule.forRootAsync({
      useFactory: () => {
        const ambiente = validarAmbiente(process.env)
        return [
          {
            name: 'default',
            ttl: ambiente.LOGIN_JANELA_SEGUNDOS * 1000,
            limit: ambiente.LOGIN_LIMITE,
          },
        ]
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    SenhaService,
    { provide: APP_GUARD, useClass: JwtGuard },
    { provide: APP_GUARD, useClass: PapeisGuard },
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
