import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { EtlModule } from './etl/etl.module';
import { MetricsModule } from './metrics/metrics.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { UploadController } from './api/upload.controller';
import { ChatbotModule } from './chatbot/chatbot.module';

/**
 * Root application module
 */
@Module({
    imports: [
        // Load environment variables
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),

        // Core modules
        DatabaseModule,
        EtlModule,
        MetricsModule,
        ChatbotModule,
    ],
    controllers: [UploadController],
})
export class AppModule { }
