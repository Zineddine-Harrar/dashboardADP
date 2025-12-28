    private buildPrompt(question: string, context: any): string {
    const systemPrompt = `Tu es un assistant pour données de nettoyage aéroportuaire.

RÈGLES:
- Utilise UNIQUEMENT les données ci-dessous
- Les durées sont DÉJÀ des moyennes (ne pas diviser)
- MAINTENANCE ≠ RENFORT (différent)

DONNÉES DU ${context.summary.date}:
Total zones: ${context.summary.totalZones}
Total passagers: ${context.summary.totalPax.toLocaleString('fr-FR')}
Total alertes: ${context.summary.totalAlerts}

ZONES (durées en minutes):
${context.metrics
            .slice(0, 15)
            .map((m: any) => {
                const maintenanceMin = Math.round((m.dureeMaintenanceSeconds || 0) / 60);
                const renfortMin = Math.round((m.dureeAdditionnelleSeconds || 0) / 60);
                const totalMin = maintenanceMin + renfortMin;
                return `${m.zoneName}: ${totalMin}min total (${maintenanceMin}min maintenance, ${renfortMin}min renfort), ${m.paxTotal} pax, ${m.alertWOs || 0} alertes`;
            })
            .join('\n')}

QUESTION: ${question}

Réponds avec les VRAIS chiffres ci-dessus.`;

    return systemPrompt;
}
