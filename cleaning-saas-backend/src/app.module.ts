import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { EtlModule } from './etl/etl.module';
import { MetricsModule } from './metrics/metrics.module';
import { UploadController } from './api/upload.controller';
import { AuthModule } from './auth/auth.module';
import { SpmModule } from './spm/spm.module';
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
        AuthModule,
        SpmModule,
        ChatbotModule,
    ],
    controllers: [UploadController],
})
export class AppModule { }
