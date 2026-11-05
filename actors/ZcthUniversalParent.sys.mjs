// One parent actor per frame. Pass classifications to the selected window.
export class ZcthUniversalParent extends JSWindowActorParent {
  receiveMessage(message){
    if(message.name!=='ZcthUniversal:State')return;
    try{
      const browser=this.browsingContext?.top?.embedderElement;
      browser?.ownerGlobal?.__zcthUniversalV019?.onFrameState(
        browser,this,message.data
      );
    }catch(_){}
  }
  didDestroy(){
    try{
      const browser=this.browsingContext?.top?.embedderElement;
      browser?.ownerGlobal?.__zcthUniversalV019?.forgetFrame(browser,this);
    }catch(_){}
  }
}
