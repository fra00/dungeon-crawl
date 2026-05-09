export default function Dungeon(props: {
    gameSession: any;
    onChangePageView: (nextPage: string) => void;
    onUpdateSession: (session: any) => void;
    staticMonsters: any[];
    staticVisibilityMap: any;
    staticEquipment: any[];
    staticItems: any[];
    staticSpells: any[];
    treasureDeck: any[];
}): React.ReactElement;