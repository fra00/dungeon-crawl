export default function DungeonHeroInfoPanel(props: {
    currentHero: any;
    currentHeroStats?: { 
        attacco: number; 
        difesa: number; 
        movimento: number; 
        mente: number; 
        corpo: number; 
        canAttackDiagonal: boolean; 
        canAttackRanged: boolean; 
        canDisarmTraps: boolean; 
        hasDoubleAttack: boolean 
    } | null;
    movementPoints?: number | null;
}): React.ReactElement | null;