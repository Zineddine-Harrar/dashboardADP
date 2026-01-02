import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Global database module
 * Makes PrismaService available throughout the application
 */
@Global()
@Module({
    providers: [PrismaService],
    exports: [PrismaService],
})
export class DatabaseModule { }
