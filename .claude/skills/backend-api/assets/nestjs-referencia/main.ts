import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import helmet from 'helmet'
import { AppModule } from './app.module.js'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const config = app.get(ConfigService)
  app.use(helmet())
  app.enableCors({ origin: config.getOrThrow<string>('CORS_ORIGIN') })
  app.enableShutdownHooks()
  await app.listen(config.get('PORT') ?? 3000)
}
bootstrap()
