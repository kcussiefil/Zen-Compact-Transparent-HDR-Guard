// Event-driven notification from an already registered, read-only browser actor.
export class ZcthStreamV014Parent extends JSWindowActorParent {
  receiveMessage(message) {
    if (message.name !== "ZcthStreamV014:MediaEvent") return;
    try {
      const browser = this.browsingContext?.top?.embedderElement;
      browser?.ownerGlobal?.__zcthSdrGlassV014?.onVideoChange(browser);
    } catch (_) {}
  }
}
