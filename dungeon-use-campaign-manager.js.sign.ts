export declare function useCampaignManager(config?: { onNotify?: (message: string) => void }): {
    saveCampaign: (heroes: any[], nextMissionIndex: number) => void;
    loadCampaign: () => { heroes: any[]; nextMissionIndex: number; timestamp: number } | null;
    hasSavedCampaign: () => boolean;
    resetCampaign: () => void;
};