export default function Armory(props: {
    gameSession: any;
    onUpdateSession: (updater: (prevSession: any) => any) => void;
    onChangePageView: (page: string) => void;
}): React.ReactElement;