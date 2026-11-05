// HDR Guard v0.1.8: forward selected stream classification from content.
export class ZcthStreamV018Parent extends JSWindowActorParent {
  receiveMessage(message){
    if(message.name!=='ZcthStreamV018:State')return;
    try{
      const browser=this.browsingContext?.top?.embedderElement;
      browser?.ownerGlobal?.__zcthSdrGlassV018?.onStreamState(
        browser,message.data?.state,message.data?.href
      );
    }catch(_){}
  }
}
