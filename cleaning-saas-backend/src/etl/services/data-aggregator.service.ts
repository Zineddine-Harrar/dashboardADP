import { Injectable } from '@nestjs/common';
import { GlobalParameterData } from './parsing/global-parameter.parser';
import { ZoneData } from './parsing/zone.parser';
import { ZoneKpiData } from './parsing/zone-kpi.parser';

export interface AggregatedZoneMetrics {
    date: Date;
    zoneId: string;
    zoneName: string;
    occurrencesMaintenance: number;
    occurrencesAdditionnelles: number;
    paxTotal: number;
    dureeMaintenanceSeconds: number;
    dureeAdditionnelleSeconds: number;
}

/**
 * Service to aggregate data from multiple parsers into unified metrics
 */
@Injectable()
export class DataAggregatorService {
    /**
     * Aggregate all parsed data into DailyZoneCleaningMetrics format
     * 
     * @param globalParam - Global parameter data with date
     * @param zones - Map of zone ID to zone data
     * @param zoneKpis - Map of zone ID to KPI data
     * @param demandMap - Nested map of zone to demand category durations
     * @param paxMap - Map of zone ID to total PAX count
     * @returns Array of aggregated metrics
     */
    aggregate(
        globalParam: GlobalParameterData,
        zones: Map<string, ZoneData>,
        zoneKpis: Map<string, ZoneKpiData>,
        demandMap: Map<string, Map<string, number>>,
        paxMap: Map<string, number>,
    ): AggregatedZoneMetrics[] {
        const results: AggregatedZoneMetrics[] = [];

        // Iterate through all zones
        for (const [zoneId, zoneData] of zones.entries()) {
            const kpi = zoneKpis.get(zoneId);
            const pax = paxMap.get(zoneId) || 0;
            const demandForZone = demandMap.get(zoneId);

            const dureeMaintenanceSeconds = demandForZone?.get('ENTRETIEN') || 0;
            const dureeAdditionnelleSeconds = demandForZone?.get('RENFORT') || 0;

            results.push({
                date: globalParam.date,
                zoneId: zoneData.id,
                zoneName: zoneData.name,
                occurrencesMaintenance: kpi?.maintenanceOccurrences || 0,
                occurrencesAdditionnelles: kpi?.reinforcementOccurrences || 0,
                paxTotal: pax,
                dureeMaintenanceSeconds,
                dureeAdditionnelleSeconds,
            });
        }

        console.log(`✅ Aggregated ${results.length} zone metrics`);
        return results;
    }
}
