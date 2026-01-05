import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ChatLogService } from './chat-log.service';

@Injectable()
export class ChatbotService {
    constructor(
        private prisma: PrismaService,
        private chatLogService: ChatLogService,
    ) { }

    async chat(question: string, date?: string): Promise<{ response: string; logId: number }> {
        const startTime = Date.now();
        let logId: number;

        try {
            // 1. R├®cup├®rer les donn├®es du dashboard
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
            take: 31 // Maximum 31 jours
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
            const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;

            if (!OPENAI_API_KEY) {
                throw new Error('OPENAI_API_KEY or OPENROUTER_API_KEY not configured in environment variables');
            }

            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'HTTP-Referer': 'http://localhost:3000',
                    'X-Title': 'DATALIAN Chatbot',
                },
                body: JSON.stringify({
                    model: 'xiaomi/mimo-v2-flash:free', // XIAOMI MiMo-V2-Flash (256K context, Claude-level performance)
                    messages: [
                        {
                            role: 'user',
                            content: prompt  // Le prompt contient d├®j├á TOUT (syst├¿me + donn├®es + question)
                        }
                    ],
                    temperature: 0.1,  // Plus bas = plus coh├®rent et pr├®visible
                    max_tokens: 800,   // Plus de tokens pour r├®ponses compl├¿tes
                    top_p: 0.9,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`OpenRouter returned ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('[CHATBOT] Error calling OpenRouter:', error);
            throw new Error(`Impossible de contacter OpenAI: ${error.message}`);
        }
    }
}
