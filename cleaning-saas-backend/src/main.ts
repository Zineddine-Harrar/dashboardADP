import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

/**
 * Bootstrap the NestJS application
 */
async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Enable validation pipes globally
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // Enable CORS for frontend integration
    app.enableCors();

    const port = process.env.PORT || 3000;
    await app.listen(port);

    console.log(`\n✅ Application is running on: http://localhost:${port}`);
    console.log(`📊 API endpoints:`);
    console.log(`   GET  /metrics?date=YYYY-MM-DD`);
    console.log(`   GET  /metrics/:zoneId?date=YYYY-MM-DD`);
    console.log(`   GET  /metrics/dates/available`);
    console.log(`   GET  /metrics/stats/summary?date=YYYY-MM-DD`);
    console.log(`   POST /upload/zip (Upload fichier ZIP avec Excel)\n`);
}

bootstrap();
