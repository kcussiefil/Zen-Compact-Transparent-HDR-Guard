export class ZcthStreamV016Parent extends JSWindowActorParent {
  receiveMessage(message) {
    if (message.name!=='ZcthStreamV016:State') return;
    try {
      const browser=this.browsingContext?.top?.embedderElement;
      browser?.ownerGlobal?.__zcthSdrGlassV016?.onStreamState(
        browser,message.data?.state,message.data?.href
      );
    } catch (_) {}
  }
}
