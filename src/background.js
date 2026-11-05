/* Interface X-Ray MV3 background: user gesture grants temporary activeTab access. */
chrome.action.onClicked.addListener(async tab => {
  if (!tab.id) return;
  try {
    await chrome.scripting.executeScript({target:{tabId:tab.id},files:['content.js']});
    await chrome.action.setBadgeText({tabId:tab.id,text:''}).catch(()=>{});
  } catch (error) {
    console.warn('Interface X-Ray cannot run here:', String(error));
    try { await chrome.action.setBadgeText({tabId:tab.id,text:'!'}); await chrome.action.setBadgeBackgroundColor({tabId:tab.id,color:'#EF8C72'}); } catch {}
  }
});
chrome.runtime.onMessage.addListener((request,sender,sendResponse)=>{
  if (request?.kind==='IX_CAPTURE' && sender.tab?.windowId != null) {
    chrome.tabs.query({active:true,windowId:sender.tab.windowId})
      .then(tabs=>{if(!tabs.some(t=>t.id===sender.tab.id))throw new Error('The inspected tab is no longer active. Screenshot canceled.');return chrome.tabs.captureVisibleTab(sender.tab.windowId,{format:'png'});})
      .then(dataUrl=>sendResponse({ok:true,dataUrl}))
      .catch(err=>sendResponse({ok:false,error:String(err)}));
    return true;
  }
  if (request?.kind==='IX_RESIZE_CURRENT' && sender.tab?.windowId!=null) {
    const requestedWidth=Math.max(350,Math.min(1920,Number(request.width)||900));
    const requestedHeight=Math.max(400,Math.min(1600,Number(request.height)||800));
    chrome.windows.get(sender.tab.windowId).then(win=>{
      const dw=requestedWidth-(Number(request.innerWidth)||requestedWidth);
      const dh=requestedHeight-(Number(request.innerHeight)||requestedHeight);
      return chrome.windows.update(sender.tab.windowId,{state:'normal',width:Math.max(360,Math.min(2400,(win.width||requestedWidth)+dw)),height:Math.max(450,Math.min(2000,(win.height||requestedHeight)+dh))});
    }).then(win=>sendResponse({ok:true,requestedWidth,requestedHeight,outerWidth:win.width,outerHeight:win.height}))
      .catch(err=>sendResponse({ok:false,error:String(err)}));
    return true;
  }
  if (request?.kind==='IX_OPEN_VIEWPORT' && sender.tab?.url) {
    const presets = {mobile:[390,844],tablet:[820,1024],desktop:[1440,900]};
    const dims=presets[request.preset] || [Math.max(350,Math.min(1800,Number(request.width)||1000)),Math.max(350,Math.min(1400,Number(request.height)||800))];
    chrome.windows.create({url:sender.tab.url,type:'popup',width:dims[0],height:dims[1],focused:true})
      .then(win=>sendResponse({ok:true,width:win?.width,height:win?.height}))
      .catch(err=>sendResponse({ok:false,error:String(err)}));
    return true;
  }
});
