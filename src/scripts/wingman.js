/// <reference path="vendors/jquery-1.8.3.min.js" />
/// <reference path="common.js" />
/// <reference path="conversation.js" />
//--------------------------------------------------------------------------------------------
function chat_getPseudoGuid() {
     return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
     });
}
//--------------------------------------------------------------------------------------------
var lastStatus = '';
var functionEventHooks = [];
//--------------------------------------------------------------------------------------------
$(window).ready(function () {

});
//--------------------------------------------------------------------------------------------
function init() {
     try {
		if (typeof chatPassword == 'undefined')
		{
			alert('Please set-up a config.js file with your settings!');
			return;
		}

          if (window.opener) {
               con = window.opener.con;
               return;
          }

          con = new JSJaCHttpBindingConnection({
               'oDbg': new JSJaCConsoleLogger(4)
          });

          setupCon(con);
          
          // try to resume a session
          if (con.resume()) {
               updateStatus("connection resumed");
               if (getRoster)
                    getRoster();
          }
          else {
               //updateStatus("waiting on input");
               doLogin();
          }
     } catch (e) {
          console.log('Init Error: ' + e);
     }
}
//--------------------------------------------------------------------------------------------
function doLogin() {
     try {
          //chatUserName = $("EmailAddress").val().replace("@");

          if (chatHttpBindURI.substr(0, 5) === 'ws://' || chatHttpBindURI.substr(0, 6) === 'wss://') {
               con = new JSJaCWebSocketConnection({
                    httpbase: chatHttpBindURI,
                    oDbg: new JSJaCConsoleLogger(4)
               });
          } else {
               con = new JSJaCHttpBindingConnection({
                    httpbase: chatHttpBindURI,
                    oDbg: new JSJaCConsoleLogger(4)
               });
          }

          setupCon(con);

          // setup args for connect method
          oArgs = new Object();
          oArgs.domain = chatDomain;
          oArgs.username = chatUserName;
          oArgs.resource = chatResource;
          oArgs.pass = chatPassword;
          //oArgs.register = oForm.register.checked;
          updateStatus("connecting..");
          con.connect(oArgs);
          return true;
     } catch (e) {
          console.log("error: " + e.ToString());
          return false;
     }
}
//--------------------------------------------------------------------------------------------
function setupCon(oCon) {
     oCon.registerHandler('iq', handleIQ);
     oCon.registerHandler('onconnect', handleConnected);
     oCon.registerHandler('onerror', handleError);
     oCon.registerHandler('status_changed', handleStatusChanged);
     oCon.registerHandler('ondisconnect', handleDisconnected);

     oCon.registerIQGet('query', NS_VERSION, handleIqVersion);
//     oCon.registerIQGet('query', NS_TIME, handleIqTime);

     var length = functionEventHooks.length;
     for (var i = 0; i < length; i++) {
          var fun = functionEventHooks[i];
          fun(oCon);
     }
}
//--------------------------------------------------------------------------------------------
function getBaseJid(jid) {
     jid = jid + ''; // convert to a string
     var pos = jid.lastIndexOf("/");
     if (pos > 0)
          return jid.substring(0, pos);
     else
          return jid;
}
//--------------------------------------------------------------------------------------------
function getResource(jid) {
     jid = jid + ''; // convert to a string
     return jid.substring(jid.lastIndexOf("/") + 1);
}
//--------------------------------------------------------------------------------------------
function escapeId(jid) {

     return jid.split('.').join('_').split('/').join('_').split('@').join('_');
}
//--------------------------------------------------------------------------------------------
var newwindow;
function showChat(elemId) {
     chatUserName = elemId;
     var height = 370;
     var width = 550;
//     var left = (screen.width / 2) - (width / 2);
//     var top = (screen.height / 2) - (height / 2);
     newwindow = window.open("/Vendors/Weavver/Wingman/Conversation.html", 'name', 'height=' + height + ', width=' + width);
     if (window.focus) { newwindow.focus() }
}
//--------------------------------------------------------------------------------------------
function handleIQ(oIQ) {
     var html = "<div class='msg'>IN (raw): " + oIQ.xml().htmlEnc() + '</div>';
     con.send(oIQ.errorReply(ERR_FEATURE_NOT_IMPLEMENTED));

     console.log(oIQ.xml());
}
//--------------------------------------------------------------------------------------------
// MUC PRESENCE:  <body xmlns='http://jabber.org/protocol/httpbind'>
//                       <presence xmlns='jabber:client' from='test@conference.web.chat/john_doe' to='test@web.chat/WeavverWebChat'>
//                            <priority>1</priority>
//                            <c xmlns='http://jabber.org/protocol/caps' node='http://pidgin.im/' hash='sha-1' ver='I22W7CegORwdbnu0ZiQwGpxr0Go='/>
//                            <x xmlns='http://jabber.org/protocol/muc#user'>
//                            <item jid='john_doe@web.chat/Laptop' affiliation='owner' role='moderator'/></x>
//                       </presence>
//                  </body>

// <body xmlns='http://jabber.org/protocol/httpbind'>
// <presence xmlns='jabber:client' from='david@web.chat/Snap' to='david@web.chat/Snap'/>
// <presence xmlns='jabber:client' from='john_doe@web.chat/Laptop' to='david@web.chat/Snap'>
//   <priority>1</priority>
//   <c xmlns='http://jabber.org/protocol/caps' node='http://pidgin.im/' hash='sha-1' ver='I22W7CegORwdbnu0ZiQwGpxr0Go='/>
//   <x xmlns='vcard-temp:x:update'><photo>d223d3c25a11a16b6cf2276fb75e964ef9f311b9</photo></x>
//   <delay xmlns='urn:xmpp:delay' from='john_doe@web.chat/Laptop' stamp='2012-12-26T13:30:52Z'></delay>
//   <x xmlns='jabber:x:delay' stamp='20121226T13:30:52'/>
// </presence>
// </body>
// $(packet.getNode()).children().length

// <body xmlns='http://jabber.org/protocol/httpbind'>
// <presence xmlns='jabber:client' from='john_doe@web.chat/Laptop' to='david@web.chat/Snap'>
//   <show>away</show>
//   <c xmlns='http://jabber.org/protocol/caps' node='http://pidgin.im/' hash='sha-1' ver='I22W7CegORwdbnu0ZiQwGpxr0Go='/>
//   <x xmlns='vcard-temp:x:update'><photo>d223d3c25a11a16b6cf2276fb75e964ef9f311b9</photo></x>
// </presence>
// </body>
//--------------------------------------------------------------------------------------------
function handleError(e) {
     var html = "An error occured: " + ("Code: " + e.getAttribute('code') + "\nType: " + e.getAttribute('type') + "\nCondition: " + e.firstChild.nodeName).htmlEnc();

     // addMessage(html);

     if (con.connected())
          con.disconnect();
}
//--------------------------------------------------------------------------------------------
function handleStatusChanged(status) {
     updateStatus(status);
}
//--------------------------------------------------------------------------------------------
function updateStatus(newState) {
     lastStatus = newState;
     $(document.body).data('connectionstatus', newState);
     $(".connectionstatus").html("status: " + newState);
}
//--------------------------------------------------------------------------------------------
function handleConnected() {
     updateStatus("connected");
     con.send(new JSJaCPresence());
}
//--------------------------------------------------------------------------------------------
function handleDisconnected() {
     updateStatus('disconnected');
     $("#submit").removeAttr("disabled");
     //$("#preflight").fadeIn("fast");
}
//--------------------------------------------------------------------------------------------
function handleIqVersion(iq) {
     con.send(iq.reply([iq.buildNode('name', 'Weavver Wingman, JsJaC'), iq.buildNode('version', JSJaC.Version), iq.buildNode('os', navigator.userAgent)]));
     return true;
}
//--------------------------------------------------------------------------------------------
function handleIqTime(iq) {
     var now = new Date();
     con.send(iq.reply([iq.buildNode('display', now.toLocaleString()), iq.buildNode('utc', now.jabberDate()), iq.buildNode('tz', now.toLocaleString().substring(now.toLocaleString().lastIndexOf(' ') + 1))]));
     return true;
}
//--------------------------------------------------------------------------------------------
//onerror = function(e) {
//  document.getElementById('err').innerHTML = e;
//
//  document.getElementById('login_pane').style.display = '';
//  document.getElementById('sendmsg_pane').style.display = 'none';
//
//  if (con && con.connected())
//    con.disconnect();
//  return false;
//};
//--------------------------------------------------------------------------------------------
$(window).unload(function () {

     // don't disconnect or suspend the connection if we are not the main window
     if (opener)
          return;

     if (typeof con != 'undefined' && con && con.connected()) {
          // save backend type
          if (con._hold)// must be binding
               (new JSJaCCookie('btype', 'binding')).write();
          else
               (new JSJaCCookie('btype', 'polling')).write();
          if (con.suspend) {
               con.suspend();
          }
          else {
               con.disconnect();
          }
     }
});
//--------------------------------------------------------------------------------------------