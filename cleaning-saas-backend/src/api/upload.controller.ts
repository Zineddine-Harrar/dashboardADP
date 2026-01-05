import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { EtlOrchestratorService } from '../etl/services/etl-orchestrator.service';
import * as fs from 'fs';
import AdmZip = require('adm-zip');
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles, Role } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('upload')
export class UploadController {
    constructor(private readonly etlOrchestrator: EtlOrchestratorService) { }

    @Roles(Role.ADMIN)
    @Post('zip')
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './data/input/uploads',
                filename: (req, file, callback) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    callback(null, `${uniqueSuffix}${extname(file.originalname)}`);
                },
            }),
            fileFilter: (req, file, callback) => {
                if (!file.originalname.match(/\.(zip)$/)) {
                    return callback(
                        new BadRequestException('Seuls les fichiers .zip sont acceptés'),
                        false,
                    );
                }
                callback(null, true);
            },
            limits: {
                fileSize: 100 * 1024 * 1024, // 100MB max
            },
        }),
    )
    async uploadZip(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('Aucun fichier fourni');
        }

        console.log(`📦 Fichier ZIP reçu: ${file.originalname} (${file.size} bytes)`);

        const extractPath = `./data/input/uploads/extracted-${Date.now()}`;
        const results = {
            success: true,
            filename: file.originalname,
            filesProcessed: 0,
            filesSuccess: 0,
            filesFailed: 0,
            errors: [] as string[],
        };

        try {
            // Extract ZIP
            console.log(`📂 Extraction du ZIP vers: ${extractPath}`);
            const zip = new AdmZip(file.path);
            zip.extractAllTo(extractPath, true);

            // Find all Excel files
            const excelFiles = this.findExcelFiles(extractPath);
            console.log(`📊 Trouvé ${excelFiles.length} fichiers Excel à ingérer`);

            results.filesProcessed = excelFiles.length;

            // Ingest each Excel file
            for (const excelFile of excelFiles) {
                try {
                    console.log(`⚙️  Ingestion de: ${excelFile}`);
                    await this.etlOrchestrator.ingestExcelFile(excelFile);
                    results.filesSuccess++;
                } catch (error) {
                    console.error(`❌ Erreur avec ${excelFile}:`, error.message);
                    results.filesFailed++;
                    results.errors.push(`${excelFile}: ${error.message}`);
                }
            }

            // Cleanup
            console.log(`🧹 Nettoyage des fichiers temporaires...`);
            fs.unlinkSync(file.path); // Delete ZIP
            this.deleteDirectory(extractPath); // Delete extracted files

            console.log(`✅ Ingestion terminée: ${results.filesSuccess}/${results.filesProcessed} réussis`);

            return results;
        } catch (error) {
            console.error('❌ Erreur lors du traitement du ZIP:', error);

            // Cleanup on error
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            if (fs.existsSync(extractPath)) {
                this.deleteDirectory(extractPath);
            }

            throw new BadRequestException(
                `Erreur lors du traitement du ZIP: ${error.message}`,
            );
        }
    }

    /**
     * Find all Excel files recursively in a directory
     */
    private findExcelFiles(dir: string): string[] {
        const files: string[] = [];
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = join(dir, entry.name);
            if (entry.isDirectory()) {
                files.push(...this.findExcelFiles(fullPath));
            } else if (entry.name.match(/\.xlsx$/i)) {
                files.push(fullPath);
            }
        }

        return files;
    }

    /**
     * Delete directory recursively
     */
    private deleteDirectory(dir: string): void {
        if (fs.existsSync(dir)) {
            fs.readdirSync(dir).forEach((file) => {
                const curPath = join(dir, file);
                if (fs.lstatSync(curPath).isDirectory()) {
                    this.deleteDirectory(curPath);
                } else {
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(dir);
        }
    }
}
