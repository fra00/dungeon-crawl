export default function PlayGame(props: {
  gameSession?: any;
  onChangePageView?: (nextPage: string) => void;
  onUpdateSession?: (session: any | ((prev: any) => any)) => void;
  campaign?: any;
  staticHeroes?: any[];
  staticEquipment?: any[];
}): React.ReactElement;