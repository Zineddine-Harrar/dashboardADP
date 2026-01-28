import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ChatLogService } from './chat-log.service';
import { SqlAgentService } from './services/sql-agent.service';
import { SpmService } from '../spm/spm.service';

@Injectable()
export class ChatbotService {
    constructor(
        private prisma: PrismaService,
        private chatLogService: ChatLogService,
        private sqlAgent: SqlAgentService,
        private spmService: SpmService,
    ) { }

    async chat(question: string, date?: string): Promise<{ response: string; logId: number }> {
        const startTime = Date.now();
        let logId: number;

        try {
            if (this.requiresSpmAnalysis(question)) {
                return await this.handleSpmQuery(question, startTime);
            }
            // 1. R├®cup├®rer les donn├®es du dashboard
            if (this.requiresSqlAgent(question)) {
                return await this.handleSqlQuery(question, startTime);
            }
            const context = await this.getContext(date, question);

            // 2. Construire le prompt pour Ollama
            const prompt = this.buildPrompt(question, context);

            // 3. Anonymiser et appeler OpenAI
            const anonymizedContext = this.anonymizeData(context);
            const anonymizedPrompt = this.buildPrompt(question, anonymizedContext);
            const response = await this.callOpenAI(anonymizedPrompt);

            // 4. Logger l'interaction r├®ussie
            logId = await this.chatLogService.logInteraction({
                question,
                response,
                responseTimeMs: Date.now() - startTime,
                success: true,
                dateContext: date,
            });

            return { response, logId };
        } catch (error) {
            // Logger l'erreur
            logId = await this.chatLogService.logInteraction({
                question,
                responseTimeMs: Date.now() - startTime,
                success: false,
                errorMessage: error.message,
                dateContext: date,
            });

            throw error;
        }
    }

    private requiresSqlAgent(question: string): boolean {
        const q = question.toLowerCase();
        const keywords = [
            'compare', 'comparaison', 'comparer',
            'septembre et', 'juillet et', 'août et', 'octobre et', 'novembre et', 'décembre et',
            'tendance', 'évolution',
            'tous les mois', 'sur 6 mois',
            'top ', 'classement', 'depuis juillet', 'depuis',
            'durant le mois', 'pendant le mois', 'au mois de', 'mois de',
            'en décembre', 'en novembre', 'en septembre', 'en juillet', 'en août', 'en octobre',
            'le plus sollicité', 'les plus sollicité', 'les plus visité',
            'plus de passagers', 'plus d\'occurrence', 'plus de maintenance'
        ];
        return keywords.some(kw => q.includes(kw));
    }

    private async handleSqlQuery(question: string, startTime: number): Promise<{ response: string; logId: number }> {
        let logId: number;
        try {
            console.log('[CHATBOT] Using SQL Agent for:', question);
            const sqlResult = await this.sqlAgent.queryDatabase(question);

            if (!sqlResult.success) {
                throw new Error(sqlResult.error || 'SQL query failed');
            }

            const prompt = `Tu es DALIA. Une requête SQL a été exécutée :

SQL: ${sqlResult.sql}

RÉSULTATS (${sqlResult.data?.length || 0} lignes):
${JSON.stringify(sqlResult.data || [], (key, value) =>
                typeof value === 'bigint' ? Number(value) : value
                , 2)}

INSTRUCTIONS DE FORMATAGE:
1. Analyse les résultats SQL
2. Réponds en français de manière claire et structurée
3. Utilise des chiffres formatés avec espaces (ex: 9 034 367)
4. Ajoute des comparaisons et pourcentages
5. FORMATAGE: Utilise des retours à la ligne pour séparer les sections
6. Évite l'excès de gras (**). Utilise-le uniquement pour les titres principaux
7. Structure ta réponse avec des sauts de ligne entre chaque point important
8. Présente les chiffres de manière aérée et lisible

QUESTION: ${question}

RÉPONSE:`;

            const response = await this.callOpenAI(prompt);

            logId = await this.chatLogService.logInteraction({
                question,
                response,
                responseTimeMs: Date.now() - startTime,
                success: true,
            });

            return { response, logId };
        } catch (error) {
            console.error('[CHATBOT] SQL Agent error:', error);
            logId = await this.chatLogService.logInteraction({
                question,
                responseTimeMs: Date.now() - startTime,
                success: false,
                errorMessage: error.message,
            });
            throw error;
        }
    }

    private requiresSpmAnalysis(question: string): boolean {
        const q = question.toLowerCase();
        const spmKeywords = [
            'spm',
            'note', 'notes',
            'satisfaction',
            'qualité', 'qualite',
            'score',
            'évaluation', 'evaluation'
        ];
        return spmKeywords.some(kw => q.includes(kw));
    }

    private async handleSpmQuery(question: string, startTime: number): Promise<{ response: string; logId: number }> {
        let logId: number;

        try {
            console.log('[CHATBOT] Using SPM Service for:', question);

            const spmData = await this.spmService.getSpmData('2025');

            console.log('[SPM] Data retrieved:', spmData.items.length, 'zones');

            // Vérifier si la question demande une corrélation avec les alertes/métriques
            const needsCorrelation = question.toLowerCase().includes('corrélation') ||
                question.toLowerCase().includes('correlation') ||
                question.toLowerCase().includes('alerte') ||
                question.toLowerCase().includes('compare');

            let metricsData = null;
            if (needsCorrelation) {
                console.log('[SPM] Fetching all metrics data for correlation...');

                // Récupérer TOUTES les métriques agrégées par mois depuis PostgreSQL
                metricsData = await this.prisma.$queryRaw`
                    SELECT 
                        TO_CHAR("date", 'Mon-YY') as mois,
                        SUM("alertWOs") as total_alertes,
                        SUM("paxTotal") as total_passagers,
                        SUM("occurrencesMaintenance") as total_occurrences_maintenance,
                        SUM("occurrencesAdditionnelles") as total_occurrences_additionnelles,
                        ROUND(SUM("dureeMaintenanceSeconds") / 3600.0, 1) as heures_maintenance,
                        ROUND(SUM("dureeAdditionnelleSeconds") / 3600.0, 1) as heures_additionnelles,
                        COUNT(DISTINCT "date") as jours_actifs,
                        COUNT(DISTINCT "zoneId") as zones_actives
                    FROM "daily_zone_cleaning_metrics"
                    WHERE EXTRACT(YEAR FROM "date") = 2025
                    GROUP BY TO_CHAR("date", 'Mon-YY'), EXTRACT(MONTH FROM "date")
                    ORDER BY EXTRACT(MONTH FROM "date")
                `;

                console.log('[SPM] Metrics data retrieved:', (metricsData as any[]).length, 'months');
            }

            const prompt = needsCorrelation ? `Tu es DALIA, assistant analytique. Analyse la corrélation entre les notes SPM et les métriques opérationnelles pour l'année 2025 :

DONNÉES SPM (notes de satisfaction par zone et par mois) :
Mois disponibles : ${spmData.months.join(', ')}
Zones : ${spmData.items.length}

ÉCHANTILLON DONNÉES SPM :
${JSON.stringify(spmData.items.slice(0, 5), null, 2)}

DONNÉES MÉTRIQUES OPÉRATIONNELLES (agrégées par mois) :
Alertes, Passagers, Occurrences, Heures de maintenance, etc.
${JSON.stringify(metricsData, (key, value) => typeof value === 'bigint' ? Number(value) : value, 2)}

INSTRUCTIONS:
1. Analyse la corrélation entre les notes SPM et les métriques (alertes, passagers, maintenance, etc.)
2. Identifie les mois où SPM est bas avec beaucoup d'alertes ou de maintenance
3. Cherche des patterns : est-ce que plus de passagers = plus d'alertes = SPM plus bas ?
4. Tire des conclusions sur la relation entre satisfaction et activité opérationnelle
5. Réponds en français de manière structurée avec sauts de ligne
6. Pour les chiffres, utilise 1 décimale

QUESTION: ${question}

RÉPONSE:` : `Tu es DALIA, assistant analytique. Analyse ces données SPM (notes de satisfaction par zone et par mois) :

DONNÉES SPM DISPONIBLES :
Mois : ${spmData.months.join(', ')}
Nombre de zones : ${spmData.items.length}

ÉCHANTILLON DES DONNÉES (par zone) :
${JSON.stringify(spmData.items.slice(0, 10), null, 2)}

INSTRUCTIONS DE FORMATAGE:
1. Analyse les tendances SPM par mois
2. Identifie les zones avec les meilleures/pires performances
3. Réponds en français de manière claire et structurée
4. Utilise des sauts de ligne pour séparer les sections
5. Évite l'excès de gras (**). Utilise-le uniquement pour les titres principaux
6. Pour les chiffres, utilise 1 décimale (ex: 7.2)

QUESTION UTILISATEUR: ${question}

RÉPONSE (en français):`;

            const response = await this.callOpenAI(prompt);

            logId = await this.chatLogService.logInteraction({
                question,
                response,
                responseTimeMs: Date.now() - startTime,
                success: true,
            });

            return { response, logId };

        } catch (error) {
            console.error('[CHATBOT] SPM query error:', error);

            logId = await this.chatLogService.logInteraction({
                question,
                responseTimeMs: Date.now() - startTime,
                success: false,
                errorMessage: error.message,
            });

            throw error;
        }
    }

    private async getContext(date?: string, question?: string): Promise<any> {
        // Extraire la date de la question si mentionn├®e
        const extractedDate = question ? this.extractDateFromQuestion(question) : null;
        const targetDate = extractedDate || date || await this.getLatestDate();

        // D├®tecter si la question porte sur une p├®riode (mois)
        const monthMatch = question?.toLowerCase().match(/tout le mois (?:de |d')?(\w+)|mois (?:de |d')?(\w+)|novembre|d├®cembre|janvier|f├®vrier|mars|avril|mai|juin|juillet|ao├╗t|septembre|octobre/i);
        const isMonthQuery = monthMatch !== null;

        // R├®cup├®rer TOUTES les zones pour la date cible
        const metrics = await this.prisma.dailyZoneCleaningMetrics.findMany({
            where: {
                date: new Date(targetDate),
            },
            select: {
                zoneName: true,
                zoneId: true,
                occurrencesMaintenance: true,
                occurrencesAdditionnelles: true,
                alertWOs: true,
                paxTotal: true,
                dailyTotalPax: true,
                dureeMaintenanceSeconds: true,
                dureeAdditionnelleSeconds: true,
                date: true,
                // NE PAS inclure les noms agents/managers pour confidentialit├®
            },
            orderBy: [
                { occurrencesMaintenance: 'desc' },
                { paxTotal: 'desc' }
            ]
        });

        // R├®cup├®rer TOUTES les dates disponibles
        const allDates = await this.prisma.dailyZoneCleaningMetrics.findMany({
            select: { date: true },
            distinct: ['date'],
            orderBy: { date: 'desc' },
            take: 200 // Support 6+ mois de données historiques (actuellement 137 jours)
        });

        // Si la question porte sur un mois, r├®cup├®rer les stats de toutes les dates du mois
        let monthlyStats = null;
        if (isMonthQuery) {
            const targetYear = new Date(targetDate).getFullYear();
            const targetMonth = new Date(targetDate).getMonth();

            const monthDates = allDates.filter(d => {
                const date = new Date(d.date);
                return date.getFullYear() === targetYear && date.getMonth() === targetMonth;
            });

            if (monthDates.length > 0) {
                const monthMetrics = await this.prisma.dailyZoneCleaningMetrics.findMany({
                    where: {
                        date: {
                            in: monthDates.map(d => d.date)
                        }
                    },
                    select: {
                        date: true,
                        alertWOs: true,
                        paxTotal: true,
                        dureeMaintenanceSeconds: true,
                        dureeAdditionnelleSeconds: true,
                        occurrencesMaintenance: true,
                        occurrencesAdditionnelles: true,
                    }
                });

                // Calculer les stats par jour
                const statsByDay: Record<string, { alerts: number; pax: number; maintenance: number; renfort: number; occurrences: number }> = {};
                monthMetrics.forEach(m => {
                    const dateKey = m.date.toISOString().split('T')[0];
                    if (!statsByDay[dateKey]) {
                        statsByDay[dateKey] = { alerts: 0, pax: 0, maintenance: 0, renfort: 0, occurrences: 0 };
                    }
                    statsByDay[dateKey].alerts += m.alertWOs || 0;
                    statsByDay[dateKey].pax += m.paxTotal || 0;
                    statsByDay[dateKey].maintenance += (m.dureeMaintenanceSeconds || 0) / 3600;
                    statsByDay[dateKey].renfort += (m.dureeAdditionnelleSeconds || 0) / 3600;
                    statsByDay[dateKey].occurrences += (m.occurrencesMaintenance || 0) + (m.occurrencesAdditionnelles || 0);
                });

                const days = Object.keys(statsByDay);
                monthlyStats = {
                    month: new Date(targetDate).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
                    numberOfDays: days.length,
                    avgAlertsPerDay: days.reduce((sum, day) => sum + statsByDay[day].alerts, 0) / days.length,
                    avgPaxPerDay: days.reduce((sum, day) => sum + statsByDay[day].pax, 0) / days.length,
                    avgMaintenancePerDay: days.reduce((sum, day) => sum + statsByDay[day].maintenance, 0) / days.length,
                    avgRenfortPerDay: days.reduce((sum, day) => sum + statsByDay[day].renfort, 0) / days.length,
                    avgOccurrencesPerDay: days.reduce((sum, day) => sum + statsByDay[day].occurrences, 0) / days.length,
                    totalAlerts: days.reduce((sum, day) => sum + statsByDay[day].alerts, 0),
                    totalPax: days.reduce((sum, day) => sum + statsByDay[day].pax, 0),
                    daysList: days
                };
            }
        }

        // Calculer des statistiques globales pour la date cible
        const summary = {
            totalZones: metrics.length,
            totalPax: metrics.length > 0 && metrics[0].dailyTotalPax ? metrics[0].dailyTotalPax : metrics.reduce((sum, m) => sum + (m.paxTotal || 0), 0),
            totalAlerts: metrics.reduce((sum, m) => sum + (m.alertWOs || 0), 0),
            totalMaintenanceHours: metrics.reduce(
                (sum, m) => sum + (m.dureeMaintenanceSeconds || 0) / 3600,
                0,
            ),
            totalAdditionnelleHours: metrics.reduce(
                (sum, m) => sum + (m.dureeAdditionnelleSeconds || 0) / 3600,
                0,
            ),
            totalOccurrencesMaintenance: metrics.reduce((sum, m) => sum + (m.occurrencesMaintenance || 0), 0),
            totalOccurrencesAdditionnelles: metrics.reduce((sum, m) => sum + (m.occurrencesAdditionnelles || 0), 0),
            date: targetDate,
        };

        // Si la question porte sur une p├®riode, calculer les stats par date
        const availableDates = allDates.map(d => d.date.toISOString().split('T')[0]);

        return {
            metrics, // TOUTES les zones de la date cible
            summary, // R├®sum├® de la date cible
            availableDates, // Toutes les dates disponibles
            targetDate, // Date utilis├®e
            monthlyStats // Stats mensuelles si question sur p├®riode
        };
    }

    private async getLatestDate(): Promise<string> {
        const latest = await this.prisma.dailyZoneCleaningMetrics.findFirst({
            orderBy: { date: 'desc' },
            select: { date: true },
        });
        return latest?.date.toISOString().split('T')[0] || new Date().toISOString().split('T')[0];
    }

    private extractDateFromQuestion(question: string): string | null {
        // Mapping des mois en fran├ºais
        const monthMap: { [key: string]: string } = {
            'janvier': '01', 'f├®vrier': '02', 'mars': '03', 'avril': '04',
            'mai': '05', 'juin': '06', 'juillet': '07', 'ao├╗t': '08',
            'septembre': '09', 'octobre': '10', 'novembre': '11', 'd├®cembre': '12'
        };

        // Regex pour diff├®rents formats de date
        const patterns = [
            // Format: "1er novembre" ou "le 1er novembre" (avec ou sans ann├®e)
            /(?:le\s+)?(\d{1,2})(?:er|├¿me)?\s+(janvier|f├®vrier|mars|avril|mai|juin|juillet|ao├╗t|septembre|octobre|novembre|d├®cembre)(?:\s+(\d{4}))?/i,
            // Format: "2 d├®cembre 2025"
            /(\d{1,2})\s+(janvier|f├®vrier|mars|avril|mai|juin|juillet|ao├╗t|septembre|octobre|novembre|d├®cembre)\s+(\d{4})/i,
            // Format: "02/12/2025"
            /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
            // Format: "2025-12-02"
            /(\d{4})-(\d{2})-(\d{2})/,
        ];

        for (const pattern of patterns) {
            const match = question.match(pattern);
            if (match) {
                if (pattern.source.includes('janvier')) {
                    // Format avec nom de mois ("2 d├®cembre 2025" ou "1er novembre")
                    const day = match[1].padStart(2, '0');
                    const month = monthMap[match[2].toLowerCase()];
                    const year = match[3] || new Date().getFullYear().toString(); // Ann├®e actuelle si non sp├®cifi├®e
                    return `${year}-${month}-${day}`;
                } else if (pattern.source.includes('\\/')) {
                    // Format: "02/12/2025" (jour/mois/ann├®e)
                    const day = match[1].padStart(2, '0');
                    const month = match[2].padStart(2, '0');
                    const year = match[3];
                    return `${year}-${month}-${day}`;
                } else {
                    // Format: "2025-12-02" (d├®j├á bon format)
                    return match[0];
                }
            }
        }

        return null;
    }

    private buildPrompt(question: string, context: any): string {
        const systemPrompt = `Tu es un assistant analytique sp├®cialis├® dans les donn├®es de nettoyage a├®roportuaire.

    ­ƒö┤ R├êGLES CRITIQUES ├Ç RESPECTER ABSOLUMENT:

    1´©ÅÔâú MOYENNES D├ëJ├Ç CALCUL├ëES
    Les dur├®es moyennes que je te fournis sont des valeurs FINALES.
    La colonne "Dur├®e Moy." contient des moyennes D├ëJ├Ç CALCUL├ëES.
    ÔØî Ne JAMAIS diviser par le nombre de passagers
    ÔØî Ne JAMAIS recalculer les moyennes
    Ô£à Utiliser directement les valeurs fournies

    2´©ÅÔâú DEUX M├ëTRIQUES DISTINCTES - NE PAS CONFONDRE !
    
    MAINTENANCE (nettoyage routine) = dureeMaintenanceSeconds
    ÔåÆ Entretien r├®gulier planifi├®, nettoyage de base
    
    RENFORT (nettoyage additionnel) = dureeAdditionnelleSeconds
    ÔåÆ Nettoyage suppl├®mentaire non planifi├®, intervention exceptionnelle
    
    ÔÜá´©Å ATTENTION: Ce sont deux m├®triques DIFF├ëRENTES !
    Quand l'utilisateur demande "renfort" ÔåÆ utilise dureeAdditionnelleSeconds
    Quand l'utilisateur demande "maintenance" ÔåÆ utilise dureeMaintenanceSeconds

    3´©ÅÔâú MAPPING DES DONN├ëES
    - "Renfort" / "Heures additionnelles" / "Heures de renfort" ÔåÆ dureeAdditionnelleSeconds
    - "Maintenance" / "Entretien" / "Nettoyage routine" ÔåÆ dureeMaintenanceSeconds
    - "Alertes" / "Alert WOs" ÔåÆ alertWOs
    - "Passagers" / "PAX" / "Passagers totaux" ÔåÆ paxTotal

    4´©ÅÔâú CAPACIT├ë D'ANALYSE TEMPORELLE
    Tu as acc├¿s aux donn├®es sur PLUSIEURS dates.
    Pour analyser une tendance, compare les m├®triques entre les diff├®rentes dates disponibles.
    Les donn├®es ne sont PAS limit├®es ├á une seule date.

    ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ

    DONN├ëES DU ${context.summary.date}:
    - Nombre de zones: ${context.summary.totalZones}
    - Passagers totaux: ${context.summary.totalPax.toLocaleString('fr-FR')}
    - Alertes totales: ${context.summary.totalAlerts}
    - Heures de MAINTENANCE: ${context.summary.totalMaintenanceHours.toFixed(1)}h
    - Heures de RENFORT: ${context.summary.totalAdditionnelleHours.toFixed(1)}h
    - Occurrences MAINTENANCE: ${context.summary.totalOccurrencesMaintenance}
    - Occurrences ADDITIONNELLES: ${context.summary.totalOccurrencesAdditionnelles}

    DATES DISPONIBLES DANS LA BASE (pour questions sur p├®riode):
    ${context.availableDates ? context.availableDates.slice(0, 10).join(', ') : 'N/A'}
    ${context.availableDates && context.availableDates.length > 10 ? `... et ${context.availableDates.length - 10} autres dates` : ''}

    ${context.monthlyStats ? `
    ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ STATISTIQUES DU MOIS ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
    Mois: ${context.monthlyStats.month}
    Nombre de jours avec donn├®es: ${context.monthlyStats.numberOfDays}
    
    MOYENNES PAR JOUR:
    - Alertes: ${context.monthlyStats.avgAlertsPerDay.toFixed(1)} alertes/jour
    - Passagers: ${context.monthlyStats.avgPaxPerDay.toFixed(0)} passagers/jour
    - Maintenance: ${context.monthlyStats.avgMaintenancePerDay.toFixed(1)}h/jour
    - Renfort: ${context.monthlyStats.avgRenfortPerDay.toFixed(1)}h/jour
    - Occurrences: ${context.monthlyStats.avgOccurrencesPerDay.toFixed(1)} occurrences/jour
    
    TOTAUX DU MOIS:
    - Total alertes: ${context.monthlyStats.totalAlerts}
    - Total passagers: ${context.monthlyStats.totalPax.toLocaleString('fr-FR')}
    
    Dates du mois: ${context.monthlyStats.daysList.slice(0, 5).join(', ')}${context.monthlyStats.daysList.length > 5 ? ` ... (${context.monthlyStats.daysList.length} jours au total)` : ''}
    ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
    ` : ''}

    D├ëTAIL PAR ZONE - TOUTES LES ${context.metrics.length} ZONES (dur├®es moyennes D├ëJ├Ç calcul├®es):
    ${context.metrics
                .map((m: any) => {
                    const maintenanceMin = Math.round((m.dureeMaintenanceSeconds || 0) / 60);
                    const renfortMin = Math.round((m.dureeAdditionnelleSeconds || 0) / 60);
                    const totalOccurrences = (m.occurrencesMaintenance || 0) + (m.occurrencesAdditionnelles || 0);
                    return `- ${m.zoneName}:
  ÔåÆ Occurrences totales: ${totalOccurrences} (${m.occurrencesMaintenance || 0} maintenance + ${m.occurrencesAdditionnelles || 0} additionnelles)
  ÔåÆ Maintenance: ${maintenanceMin} min
  ÔåÆ Renfort: ${renfortMin} min
  ÔåÆ Passagers: ${m.paxTotal}
  ÔåÆ Alertes: ${m.alertWOs || 0}`;
                })
                .join('\n')}

    ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ

    EXEMPLES DE BONNES R├ëPONSES:

    Q: "Quelle zone a la plus grande dur├®e moyenne de maintenance?"
    R: "BS Femmes d├®part F1 a la plus grande dur├®e moyenne avec 144 minutes (2.4h) de maintenance."

    Q: "Top 5 zones par heures de renfort"
    R: "1. Zone A: 85 min de renfort
    2. Zone B: 72 min de renfort
    3. Zone C: 68 min de renfort
    ..."

    Q: "Tendance du renfort en novembre"
    R: "Analyse des heures de renfort:
    - 01/11: 45.2h
    - 15/11: 52.8h (+17%)
    - 29/11: 48.3h (-8%)
    Tendance: Relativement stable autour de 48h."

    ÔØî ERREURS ├Ç ├ëVITER:
    - Ne PAS dire "2.4h / 12251 passagers = 0.0195h/passager"
    - Ne PAS confondre maintenance et renfort
    - Ne PAS dire "les donn├®es manquent" si elles existent
    - Ne PAS recalculer les moyennes

    QUESTION: ${question}

    R├®ponds de mani├¿re claire, concise et PR├ëCISE en fran├ºais.
    Si tu ne peux pas r├®pondre avec les donn├®es fournies, dis-le clairement.`;

        return systemPrompt;
    }

    // Anonymiser les donn├®es avant envoi ├á OpenAI
    private anonymizeData(context: any): any {
        return {
            metrics: context.metrics.map((m: any) => ({
                zoneName: m.zoneName, // Garder nom de zone
                zoneId: m.zoneId,
                paxTotal: m.paxTotal,
                alertWOs: m.alertWOs,
                dureeMaintenanceSeconds: m.dureeMaintenanceSeconds,
                dureeAdditionnelleSeconds: m.dureeAdditionnelleSeconds,
                occurrencesMaintenance: m.occurrencesMaintenance,
                occurrencesAdditionnelles: m.occurrencesAdditionnelles,
                // NE PAS inclure: agents, managers, noms d'├®quipe
            })),
            summary: context.summary,
            availableDates: context.availableDates, // IMPORTANT: Conserver les dates disponibles
            targetDate: context.targetDate, // IMPORTANT: Conserver la date cible
            monthlyStats: context.monthlyStats, // IMPORTANT: Conserver les stats mensuelles
        };
    }

    private async callOpenAI(prompt: string): Promise<string> {
        try {
            const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

            if (!OPENAI_API_KEY) {
                throw new Error('OPENAI_API_KEY not configured in environment variables');
            }

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini', // Fast, cheap, excellent model
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.1,
                    max_tokens: 800,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`OpenAI returned ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('[CHATBOT] Error calling OpenAI:', error);
            throw new Error(`Impossible de contacter OpenAI: ${error.message}`);
        }
    }
}
