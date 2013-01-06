//--------------------------------------------------------------------------------------------
var MessageStyle = 'Chat'; // Customer
//--------------------------------------------------------------------------------------------
// typing notification: <message xmlns="jabber:client" xmlns:stream="http://etherx.jabber.org/streams" from="john_doe@web.chat/Laptop" to="david@web.chat" type="chat" id="purple20529fe1">
//<composing xmlns="http://jabber.org/protocol/chatstates"/>
//</message>
//--------------------------------------------------------------------------------------------
var participants = [];
var chatRoomId;
var groupChat = false;
var customerChat = false;
//--------------------------------------------------------------------------------------------
$(document).ready(function () {
     $("#CommentUpdate").keyup(function (ev) {
          if (ev.which === 13) { // user presses ENTER
               addMyMessage();
          }
     });

     //if (MessageStyle == 'Chat')

     if (window.opener) {
          con = window.opener.con;
          window.opener.functionEventHooks.push(messageHooks);
          messageHooks(con);
          setModeReady();
          init();
     }
     else {
          functionEventHooks.push(messageHooks);
     }

     chatRoomId = getQueryVariable('id');

     // participants.push(id);

     if (chatRoomId) {
          document.title = chatRoomId;
          $('#EndChat').css('display', 'none');
          //assertParticipantAndLoadTemplate(chatRoomId);
          $('#participants').hide();
     }
     else {
          document.title = 'Group Chat';
          chatRoomId = chatUserName + "@conference.web.chat";
          groupChat = true;
          $('#EndChat').css('display', '');
          $("#preflight").fadeIn("fast");
     }


     // init();

     CKEDITOR.config.toolbarCanCollapse = false;
     CKEDITOR.config.removePlugins = 'elementspath';
     CKEDITOR.config.resize_enabled = false;
     CKEDITOR.config.enterMode = CKEDITOR.ENTER_BR;
     CKEDITOR.config.shiftEnterMode = CKEDITOR.ENTER_BR;
     CKEDITOR.config.pasteFromWordRemoveFontStyles = true;

     var editor = CKEDITOR.replace('CommentUpdate');
     editor.config.height = '50px';
     editor.config.width = '100%';
     editor.config.toolbar = [
    ['Bold', 'Italic', '-', 'Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo', '-', 'Send']];
     editor.on('key', function (ev) {
          if (ev.data.keyCode == 13) {
               ev.cancel();
               addMyMessage();
          }
     });
     editor.config.toolbar = [['Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord']];

     // for testing
     // setModeReady();
     // assertParticipantAndLoadTemplate('john_doe@web.chat');
});
//--------------------------------------------------------------------------------------------
function messageHooks(oCon) {
     oCon.registerHandler('onconnect', messageHandleConnected);
     oCon.registerHandler('message', messageHandleMessage);
     oCon.registerHandler('presence', messageHandlePresence);
     oCon.registerHandler('ondisconnect', messageHandleDisconnected);
}
//--------------------------------------------------------------------------------------------
function messageHandleConnected() {
     $("#SendMessage").removeAttr("disabled");

     addMyMessage();
     setModeReady();

     if (groupChat) {
          if (joinMUC()) {
               addMessage("<div>Please wait while we get a representative..</div>");

               inviteMUCParticipant();

               // Add the user's intro message to the chat
               var message = $("#Inquiry").val();
               var oMsg = new JSJaCMessage();
               oMsg.setTo(new JSJaCJID(chatRoomId));
               oMsg.setBody(message);
               oMsg.setType('groupchat');
               con.send(oMsg);
          }
     }
}
//--------------------------------------------------------------------------------------------
function messageHandleDisconnected() {
     $("#SendMessage").prop('disabled', 'disabled');
}
//--------------------------------------------------------------------------------------------
function getQueryVariable(variable) {
     var query = window.location.search.substring(1);
     var vars = query.split('&');
     for (var i = 0; i < vars.length; i++) {
          var pair = vars[i].split('=');
          if (decodeURIComponent(pair[0]) == variable) {
               return decodeURIComponent(pair[1]);
          }
     }
     console.log('Query variable %s not found', variable);
}
//--------------------------------------------------------------------------------------------
function messageHandleMessage(packet) {
     var html = '';
     var jid = packet.getFromJID().getNode() + '@' + packet.getFromJID().getDomain();
     // alert(jid + " received, vs chatid: " + chatRoomId);
     if (jid != chatRoomId)
          return;

     var messageFrom = packet.getFromJID().getNode();
     messageFrom = (packet.getType() == "groupchat") ? getResource(packet.getFromJID()) : messageFrom;

     var xNode = packet.getChild('x', 'http://jabber.org/protocol/muc#user');
     if (xNode && xNode.namespaceURI == "http://jabber.org/protocol/muc#user") {
          // <message xmlns='jabber:client' from='cb0ce8d2-da0e-4c44-9d77-0d224259b2cb@conference.web.chat' to='cb0ce8d2-da0e-4c44-9d77-0d224259b2cb@web.chat/WeavverWebChat' xml:lang='en'>
          //   <x xmlns='http://jabber.org/protocol/muc#user'>
          //        <decline from='supportagent@web.chat'/>
          //   </x>
          // </message>

          if (xNode.getElementsByTagName("decline").length == 1) {
               chatDisconnectMessage = "A representative is not available at this time.. please try again later.<br /><br />";
               quit();
          }
     }
     var isTyping = packet.getChild("composing");
     if (isTyping) {
          html += '<div class="msg typing">' + messageFrom + ' is typing...';
          html += packet.getBody().htmlEnc() + '</div>';
          addMessage(html);
     }
     else if (packet.getChild("body")) {
          // color = (jid == chatJID) ? 'blue' : 'red';
          $('.typing').remove();
          html += '<div class="msg" style="color:' + 'black' + '">' + messageFrom + ': ' + packet.getBody().htmlEnc() + '</div>';
          addMessage(html);
     }
}
//--------------------------------------------------------------------------------------------
//<a href="#" onclick="OpenChat('Chat.html')">Chat</a>
//--------------------------------------------------------------------------------------------
function addMyMessage() {
     try {
          var message = CKEDITOR.instances.CommentUpdate.getData();
          if (!message)
               return;

          if (!groupChat) // we do this because we get the message forwarded back from the server anyways..
          {
               html = '<div id="msg">' + chatDisplayName + ": " + message + '</div>';
               addMessage(html);
          }

          var oMsg = new JSJaCMessage();
          oMsg.setTo(new JSJaCJID(chatRoomId));
          oMsg.setBody(message);
          if (groupChat)
               oMsg.setType('groupchat');

          y = document.createElement('div')
          y.innerHTML = message;

          var htmlBody = oMsg.buildNode("body");
          htmlBody.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
          htmlBody.appendChild(y);

          var htmlNode = oMsg.buildNode("html", [htmlBody]);
          htmlNode.setAttribute("xmlns", "http://jabber.org/protocol/xhtml-im");

          oMsg.appendNode(htmlNode);

          con.send(oMsg);
          CKEDITOR.instances.CommentUpdate.setData('');
          CKEDITOR.instances.CommentUpdate.focus();
          return true;
     } catch (e) {
          html = "<div class='msg error'>Error: " + e.message + "</div>";
          addMessage(html);
          return false;
     }
}
//--------------------------------------------------------------------------------------------
function addMessage($msg) {
     if ($msg == "")
          return;
     $("#chatBox").append($msg);
     ScrollBottom();
}
//--------------------------------------------------------------------------------------------
function ScrollBottom() {
     var objDiv = document.getElementById("chatBox");
     objDiv.scrollTop = objDiv.scrollHeight;
}
//--------------------------------------------------------------------------------------------
function assertParticipantAndLoadTemplate(id) {
     if (window.opener) {
          assertParticipant(id);
     }
     else {
          $.get('http://www.weavver.local/products/snap/resources/Roster.html #RosterItemTemplate', function (data) {
               itemTemplate = $('#RosterItemTemplate', data);
               assertParticipant(id);
          });
     }
}
//--------------------------------------------------------------------------------------------
function assertParticipant(id) {
     var safeId = "#" + escapeId(id);
     var mainNode = (window.opener) ? window.opener.$(safeId).clone(true) : assertRosterItem(id);

     console.log(mainNode);
     $('#left', mainNode).remove();
     $('#right', mainNode).remove();
//     if ($(safeId).length) {
//          $(safeId).replaceWith(mainNode);
//     }
//     else {
          $("#participants").append(mainNode);
//     }
     mainNode.trigger('mouseout');
}
//--------------------------------------------------------------------------------------------
function beginCustomerChat() {
     //     if (!Page_ClientValidate("")) {
     //          alert("Please fill out the required fields.");
     //          return;
     //     }

     //     PageMethods.LogInquiry($("#UserName").val(),
     //                                           $("#EmailAddress").val(),
     //                                           $("#PhoneNumber").val(),
     //                                           $('form input[type=radio]:checked').val(),
     //                                           $("#Inquiry").val(),
     //                                           onSucceed,
     //                                           onError);

     chatDomain = 'web.chat';
     chatDisplayName = 'Customer';
     chatUserName = chat_getPseudoGuid();
     chatPassword = '12341234';
     chatResource = 'WeavverWebChat';
     chatRoomId = chatUserName + '@conference.web.chat';
     chatJID = chatUserName + '@' + chatDomain + '/' + chatResource;

     groupChat = true;
     assertParticipantAndLoadTemplate(chatDisplayName);

     doLogin();
}
//--------------------------------------------------------------------------------------------
function joinMUC() {
     //Set the JID with resource
     //Example: my_username@my_domain/my_chat_client

     //Set the Full Room ID with your nickname as the resource
     //Example: room_name@conference.my_domain/CHATROOMNICKNAME
     var joinPacket = new JSJaCPresence();
     var full_room_id = chatRoomId + "/" + chatDisplayName;
     joinPacket.setTo(full_room_id);

     //Build item affiliation element
     var inode = joinPacket.buildNode("item");
     inode.setAttribute("affiliation", "none");
     inode.setAttribute("jid", chatJID);
     inode.setAttribute("role", "owner");

     //Build X Element (with item affiliation child)
     var xnode = joinPacket.buildNode("x", [inode]);
     xnode.setAttribute("xmlns", "http://jabber.org/protocol/muc#user");

     //Append new nodes to join packet
     joinPacket.appendNode(xnode);

     //Set status in room
     joinPacket.setStatus('available');

     var success = con.send(joinPacket, function (data) { console.log(data.getDoc()); });
     //if (success) {
          setMUCRoomTopic("Inquiry");
          return true;
     //}
}
//--------------------------------------------------------------------------------------------
function startOver() {
     $("#wrapup").fadeOut("fast", function () {
          $("#preflight").fadeIn("fast");
     });
}
//--------------------------------------------------------------------------------------------
function setModeReady() {
     $("#preflight").fadeOut("fast", function () {
          $("#chat").fadeIn("fast");
          $("#CommentUpdate").focus();
     });

     $('#chatBox').append($('.connectionstatus'));
}
//--------------------------------------------------------------------------------------------
// <message to="test@conference.web.chat"><x xmlns="http://jabber.org/protocol/muc#user"><invite to="john_doe@web.chat"/></x></message>
function inviteMUCParticipant() {
     var oMsg = new JSJaCMessage();
     oMsg.setTo(new JSJaCJID(chatUserName + '@conference.web.chat')); // chatUserName + "@conference.web.chat")
     //oMsg.setBody("Customer Inquiry");
     var xReason = oMsg.buildNode("reason", "Customer Inquiry");

     var inviteNode = oMsg.buildNode("invite", [xReason]);
     //xInviteNode.setAttribute("password", "test");
     inviteNode.setAttribute("to", chatSupportAgent);

     var xNode = oMsg.buildNode("x", [inviteNode]);
     xNode.setAttribute("xmlns", "http://jabber.org/protocol/muc#user");
     oMsg.appendNode(xNode);

     var success = con.send(oMsg, function (data) { console.log(data.getDoc()); })
}
//--------------------------------------------------------------------------------------------
function onSucceed(results, currentContext, methodName) {
     //alert(results);
}
//--------------------------------------------------------------------------------------------
function onError(results, currentContext, methodName) {
     // alert(results);
}
//--------------------------------------------------------------------------------------------
function setMUCRoomTopic(roomSubject) {
     var oMsg = new JSJaCMessage();
     oMsg.setTo(new JSJaCJID(chatRoomId));
     oMsg.setType('groupchat');
     //     
     //     var subject = oMsg.buildNode("subject");
     //     subject.setAttribute("affiliation", "none");
     //
     oMsg.setSubject(roomSubject);
     con.send(oMsg);
}
//--------------------------------------------------------------------------------------------
function messageHandlePresence(packet) {
     var isMucPresenceEvent = false;
     var jid = packet.getFromJID() + '';

     var xNode = packet.getChild('x', 'http://jabber.org/protocol/muc#user');
     if (xNode && xNode.namespaceURI == "http://jabber.org/protocol/muc#user") {
          isMucPresenceEvent = true;
          jid = getResource(jid);
     }

     var html = '<div class="msg">';
     if (!packet.getType() && !packet.getShow()) {

          if (isMucPresenceEvent) {
               html += jid + " has joined the chat";
               assertParticipantAndLoadTemplate(jid);
          }
          else if (getResource(jid) == "WeavverWebChat") {
               return;
          }
          else {
               // standard presence event, ignore
//               html += jid + ' has become available.</b>';
//               assertParticipantAndLoadTemplate(jid);
          }
     }
     else {
          if (isMucPresenceEvent) {
               html += jid + " has left the chat";
               $('#' + jid).remove();
          }
          else {
               // standard presence event, ignore
//               html += '' + packet.getFromJID() + ' has set his presence to ';
//               if (packet.getType())
//                    html += packet.getType() + '.</b>';
//               else
//                    html += packet.getShow() + '.</b>';
//               if (packet.getStatus())
//                    html += ' (' + packet.getStatus().htmlEnc() + ')';
          }
     }
     html += '</div>';

     addMessage(html);
}
//--------------------------------------------------------------------------------------------
function quit() {

     $('#wrapup').after($('.connectionstatus'));
     $('#participants').html('');

     var p = new JSJaCPresence();
     p.setType("unavailable");
     con.send(p);
     con.disconnect();

     $("#DisconnectMessage").html(chatDisconnectMessage);
     chatDisconnectMessage = "";


     updateStatus("disconnected");

     $("#chat").fadeOut("fast", function () {
          $("#wrapup").fadeIn("fast");
     } );
}
//--------------------------------------------------------------------------------------------