// Parent process: never give active status to an unselected tab.
export class Zvp9SidebarGuardParent extends JSWindowActorParent {
  receiveMessage(message) {
    if (message.name !== 'Zvp9:GetState') return null;
    try {
      const browser = this.browsingContext?.top?.embedderElement;
      const win = browser?.ownerGlobal;
      if (!win || browser !== win.gBrowser?.selectedBrowser) {
        return { enabled: false, active: false, level: 1 };
      }
      return win.__zvp9SidebarGuardV010?.snapshot() || { enabled: false, active: false, level: 1 };
    } catch (_) { return { enabled: false, active: false, level: 1 }; }
  }
}
