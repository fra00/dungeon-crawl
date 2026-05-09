export default function ShopInventory(props: { 
  items?: any[]; 
  selectedItemId?: number | null; 
  canBuy?: boolean; 
  buyReason?: string; 
  onSelect?: (id: number) => void; 
  onBuy?: () => void; 
  onEnterDungeon?: () => void; 
  onExit?: () => void; 
}): React.ReactElement;