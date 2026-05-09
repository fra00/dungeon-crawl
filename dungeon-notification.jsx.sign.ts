export default function DungeonNotification(props: { 
  message?: string | null; 
  duration?: number; 
  onClose: () => void; 
}): React.ReactElement | null;