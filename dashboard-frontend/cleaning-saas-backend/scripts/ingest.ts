#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { EtlOrchestratorService } from '../src/etl/services/etl-orchestrator.service';
import * as path from 'path';

/**
 * CLI script to ingest an Excel file into the database
 * Usage: npm run ingest -- <path-to-excel-file>
 */
async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.error('\n❌ Error: No file path provided');
        console.log('\nUsage: npm run ingest -- <path-to-excel-file>');
        console.log('Example: npm run ingest -- ./data/input/Standard.xlsx\n');
        process.exit(1);
    }

    const filePath = path.resolve(args[0]);

    console.log('\n🔧 Initializing application...');
    const app = await NestFactory.createApplicationContext(AppModule, {
        logger: ['error', 'warn'],
    });

    try {
        const etlService = app.get(EtlOrchestratorService);
        await etlService.ingestExcelFile(filePath);

        console.log('✅ Ingestion completed successfully!\n');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Ingestion failed:', error.message);
        process.exit(1);
    } finally {
        await app.close();
    }
}

main();
