import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ExcelParserService } from './excel-parser.service';
import { GlobalParameterParser } from './parsing/global-parameter.parser';
import { ZoneParser } from './parsing/zone.parser';
import { ZoneKpiParser } from './parsing/zone-kpi.parser';
import { ZoneDemandCategoryKpiParser } from './parsing/zone-demand-category-kpi.parser';
import { CrowdInformationParser } from './parsing/crowd-information.parser';
import { DataAggregatorService } from './data-aggregator.service';

/**
 * Main ETL orchestrator service
 * Coordinates the entire ETL process from Excel file to database
 */
@Injectable()
export class EtlOrchestratorService {
    constructor(
        private prisma: PrismaService,
        private excelParser: ExcelParserService,
        private globalParameterParser: GlobalParameterParser,
        private zoneParser: ZoneParser,
        private zoneKpiParser: ZoneKpiParser,
        private zoneDemandParser: ZoneDemandCategoryKpiParser,
        private crowdParser: CrowdInformationParser,
        private aggregator: DataAggregatorService,
    ) { }

    /**
     * Execute the complete ETL process
     * @param filePath - Path to the Excel file
     * @returns Number of records inserted/updated
     */
    async ingestExcelFile(filePath: string): Promise<number> {
        console.log(`\n🚀 Starting ETL process for: ${filePath}\n`);

        try {
            // Step 1: Read Excel file
            console.log('📖 Reading Excel file...');
            const workbook = this.excelParser.readExcelFile(filePath);
            console.log(`   Found ${workbook.SheetNames.length} sheets`);

            // Step 2: Parse all sheets
            console.log('\n📊 Parsing sheets...');

            const globalParam = this.globalParameterParser.parse(workbook);
            if (!globalParam) {
                throw new Error('Failed to parse GlobalParameter sheet');
            }
            console.log(`   Date: ${globalParam.date.toISOString().split('T')[0]}`);

            const zones = this.zoneParser.parse(workbook);
            const zoneKpis = this.zoneKpiParser.parse(workbook);
            const demandMap = this.zoneDemandParser.parse(workbook);

            // Get zone group mapping for PAX aggregation
            const groupMapping = this.zoneParser.getGroupMapping(workbook);
            const paxMap = this.crowdParser.parse(workbook, groupMapping);

            // Step 3: Aggregate data
            console.log('\n🔄 Aggregating data...');
            const metrics = this.aggregator.aggregate(
                globalParam,
                zones,
                zoneKpis,
                demandMap,
                paxMap,
            );

            // Step 4: Insert into database
            console.log('\n💾 Inserting into database...');
            let insertedCount = 0;

            for (const metric of metrics) {
                await this.prisma.dailyZoneCleaningMetrics.upsert({
                    where: {
                        date_zoneId: {
                            date: metric.date,
                            zoneId: metric.zoneId,
                        },
                    },
                    update: {
                        zoneName: metric.zoneName,
                        occurrencesMaintenance: metric.occurrencesMaintenance,
                        occurrencesAdditionnelles: metric.occurrencesAdditionnelles,
                        paxTotal: metric.paxTotal,
                        dureeMaintenanceSeconds: metric.dureeMaintenanceSeconds,
                        dureeAdditionnelleSeconds: metric.dureeAdditionnelleSeconds,
                        alertWOs: metric.alertWOs,
                        minVisits: metric.minVisits,
                        maxVisits: metric.maxVisits,
                        nbVisits: metric.nbVisits,
                    },
                    create: {
                        date: metric.date,
                        zoneId: metric.zoneId,
                        zoneName: metric.zoneName,
                        occurrencesMaintenance: metric.occurrencesMaintenance,
                        occurrencesAdditionnelles: metric.occurrencesAdditionnelles,
                        paxTotal: metric.paxTotal,
                        dureeMaintenanceSeconds: metric.dureeMaintenanceSeconds,
                        dureeAdditionnelleSeconds: metric.dureeAdditionnelleSeconds,
                        alertWOs: metric.alertWOs,
                        minVisits: metric.minVisits,
                        maxVisits: metric.maxVisits,
                        nbVisits: metric.nbVisits,
                    },
                });
                insertedCount++;
            }

            console.log(`\n✅ ETL process completed successfully!`);
            console.log(`   Inserted/Updated: ${insertedCount} records\n`);

            return insertedCount;
        } catch (error) {
            console.error('\n❌ ETL process failed:', error);
            throw error;
        }
    }
}
