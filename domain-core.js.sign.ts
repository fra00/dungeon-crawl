export const PageNavigationEnum: {
  readonly MAIN_MENU: "MAIN_MENU";
  readonly PLAY_GAME: "PLAY_GAME";
  readonly EDITOR_GAME: "EDITOR_GAME";
  readonly SHOP: "SHOP";
  readonly DUNGEON: "DUNGEON";
  readonly DUNGEON_DESCRIPTION: "DUNGEON_DESCRIPTION";
};

export const NavigationStatus: (data?: { currentPageView?: string }) => {
  currentPageView: string;
};