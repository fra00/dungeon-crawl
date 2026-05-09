export default function HeroSummary(props: {
  heroes?: any[];
  staticHeroes?: any[];
  staticEquipment?: any[];
  selectedIndex?: number;
  onSelect?: (index: number) => void;
}): any;