import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Enable CORS for all origins (development mode)
  app.enableCors({
    origin: '*',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
  })

  const port = process.env.PORT || 3333
  await app.listen(port)

  console.log(`API running on port ${port}`)
  console.log(`CORS enabled for all origins`)
}

bootstrap()
