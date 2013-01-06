//--------------------------------------------------------------------------------------------
var DummyData = [
          { "id": "d@weavver.com", "type": "rosteritem", "agentmode": "on",  "label": "d", "status": "not available", "avatarpath": null, "presweight": 1, "bordercolor": "green" },
          { "id": "e@weavver.com", "type": "rosteritem", "agentmode": "off", "label": "e", "status": "not available", "avatarpath": null, "presweight": 1, "bordercolor": "green" },
          { "id": "f@weavver.com", "type": "rosteritem", "agentmode": "on",  "label": "John Doe", "status": "not available", "avatarpath": null, "presweight": 2, "bordercolor": "blue" },
          { "id": "a@weavver.com", "type": "rosteritem", "agentmode": "on",  "label": "a", "status": "not available", "avatarpath": null, "presweight": 6, "bordercolor": "orange" },
          { "id": "b@weavver.com", "type": "rosteritem", "agentmode": "off", "label": "b", "status": "not available", "avatarpath": null, "presweight": 3, "bordercolor": "blue" },
          { "id": "c@weavver.com", "type": "rosteritem", "agentmode": "off", "label": "c", "status": "not available", "avatarpath": null, "presweight": 3, "bordercolor": "blue" }
     ];
//--------------------------------------------------------------------------------------------
var RunningInBrowser = true;
var rosterEvents;
var itemTemplate;
//--------------------------------------------------------------------------------------------
$(document).ready(function () {
     itemTemplate = $("#RosterItemTemplate").remove();

     functionEventHooks.push(rosterHooks);
     //createTestData();

     $('#TileView').click(function () {
          $(document).data('liststyle', 'left');
          $('#Roster,#Calls').children().css('float', 'left');
     });

     $('#ListView').click(function () {
          $(document).data('liststyle', '');
          $('#Roster,#Calls').children().css('float', '');
     });

     $('#Roster').contextmenu(function () {
          if (window.external)
               window.external.ShowRosterMenu($(this).data('id'));
     });

     $('#DisplayName').click(function () {
          $('#DisplayName').css('display', 'none');
          $('#DisplayName_Entry')
             .val($('#DisplayName').text())
             .css('display', '')
             .focus();
     });

     $('#DisplayName_Entry').blur(function () {
          $('#DisplayName_Entry').css('display', 'none');
          $('#DisplayName')
        .text($('#DisplayName_Entry').val())
        .css('display', '');
     });

     $('#StatusMessage').click(function () {
          $('#StatusMessage').css('display', 'none');
          $('#StatusMessage_Entry')
        .val($('#StatusMessage').text())
        .css('display', '')
        .focus();
     });

     $('#StatusMessage_Entry').blur(function () {
          $('#StatusMessage_Entry').css('display', 'none');
          $('#StatusMessage')
        .text($('#StatusMessage_Entry').val())
        .css('display', '');
     });

     $('.CallTimer').data('start', moment().unix());
     window.setInterval(callTimerTick, 1000);
});
//--------------------------------------------------------------------------------------------
function callTimerTick() {
     time = $('.CallTimer').data('start');

     seconds = moment().subtract('seconds', time).unix();
     seconds = Math.round(seconds);
     minutes = Math.floor(seconds / 60);
     minutes = (minutes >= 10) ? minutes : "0" + minutes;
     seconds = Math.floor(seconds % 60);
     seconds = (seconds >= 10) ? seconds : "0" + seconds;
     display = minutes + ":" + seconds;

     $('.CallTimer').html(display);

     //$('.CallTimer').data('tick', time);

     //window.setInterval(callTimerTick, 1000);
}
//--------------------------------------------------------------------------------------------
function createTestData() {
     for (i = 0; i < DummyData.length; i++) {
          var data = DummyData[i];
          var item = assertRosterItem(data.id);
          item.attr('id', data.id);
          item.data('type', 'rosteritem');
          item.data('presweight', data.presweight);
          item.data('label', data.label);
          item.data('show', 'offline');
          item.data('statusmessage', data.status);
          item.data('avatarpath', data.avatarpath);
          item.data('agentmode', data.agentmode);
          item.data('bordercolor', data.bordercolor);
          item.data('searchtext', data.label);
          item.attr('title', "Id: " + data.id);
     }
}
//--------------------------------------------------------------------------------------------
function rosterHooks(oCon) {
     oCon.registerHandler('onconnect', rosterHandleConnected);
     oCon.registerHandler('presence', rosterHandlePresence);
     oCon.registerHandler('message', rosterHandleMessage);
}
//--------------------------------------------------------------------------------------------
function rosterHandleConnected() {
     getRoster();
}
//--------------------------------------------------------------------------------------------
function rosterHandleMessage(packet) {
     var jid = packet.getFromJID().getNode() + '@' + packet.getFromJID().getDomain();
     var ret = assertChat(jid);

     if (ret.newwindow) {
          $(ret.window).load(function () {
               ret.window.messageHandleMessage(packet);
          });
     }
}
//--------------------------------------------------------------------------------------------
function getRoster() {
     // <iq from='mitcheloc@weavver.com/Snap' id='bv1bs71f' type='get'> <query xmlns='jabber:iq:roster'/></iq>")
     var getRosterIQ = new JSJaCIQ();
     getRosterIQ.setFrom(new JSJaCJID(chatJID));
     getRosterIQ.setType('get');
     getRosterIQ.setQuery('jabber:iq:roster');
     con.sendIQ(getRosterIQ, { result_handler: function (aIq, arg) {
               // <iq xmlns='jabber:client' from='mitcheloc@weavver.com' to='mitcheloc@weavver.com/Snap' id='JSJaCID_2' type='result'>
               // <query xmlns='jabber:iq:roster'>
               // <item subscription='both' name='Mitchel Constantin' jid='mythicalbox@weavver.com'>
               //   <group>Contacts</group></item>
               // <item subscription='from' jid='fatcat@weavver.com'/>
               var node = aIq.getQuery();
               $(node).children().each(function () {
                    var jid = $(this).attr('jid');
                    var id = '#' + escapeId(jid);
                    var item = assertRosterItem($(this).attr('jid'));
                    item.data('id', jid);
                    item.data('avatarpath', 'default');
                    item.data('type', 'rosteritem');
                    item.data('label', $(this).attr('name'));
                    item.data('searchtext', $(this).attr('name'));
               });
          }
     });
     return getRosterIQ;
}
var parentWindow;
var chatWindow;
var participants = [];
//--------------------------------------------------------------------------------------------
function assertChat(jid) {
     for (var i = participants.length - 1; i > -1; i--) {
          if (participants[i].closed) {
               participants.splice(i, 1);
          }
          if (participants[i] && participants[i].location.search == '?id=' + jid) {
               participants[i].focus();
               return;
          }
     }

     if (RunningInBrowser) {
          var chatWindow = window.open('#', jid, 'width=550,height=350,resizable=1');
          chatWindow.location.href = 'Message.html?id=' + jid;
          participants.push(chatWindow);
          return { "window": chatWindow, "new": true };
     }
     else {
          window.external.RosterItem_DoubleClick(jid);
     }
}
//--------------------------------------------------------------------------------------------
function insertSorted(element) {
     $('#Roster').children().each(function () {
          var showA = $(this).data('show');
          var showB = $(element).data('show');
          if (showA = 'online' && showB == 'offline') {
               $(element).insertBefore($(this));
               $(element).show();
               return false;
          }
          else if (showA == showB) {
               // is a < b?
               var labelA = $(this).data('label');
               var labelB = $(element).data('label');
               var a = (typeof labelA != 'undefined') ? labelA : $(this).data('id');
               var b = (typeof labelB != 'undefined') ? labelB : $(this).data('id');
               if (a.toUpperCase() > b.toUpperCase()) {
                    $(element).insertBefore($(this));
                    $(element).show();
                    return false; // breaks out of the loop
               }
          }
     });
     if ($(element).parent('div').length == 0) {
          $('#Roster').append(element);
          $(element).show();
     }
}
//--------------------------------------------------------------------------------------------
function rosterHandlePresence(packet) {
     var data = $(packet.getNode());

     var jid = getBaseJid(data.attr('from'));
     var item = assertRosterItem(jid);
     item.data('id', jid);
     item.data('type', 'rosteritem');
     item.data('label', jid);
     item.data('searchtext', data.attr('from'));
     item.data('priority', $('priority', data).text());

     var type = data.attr('type');
     if (type == "unavailable") {
          item.data('show', 'offline');
     }
     else if (type == "error") {
          item.data('statusmessage', 'error');
     }
     else {
          var show = $('show', data);
          if (!show.length)
               item.data('show', 'online');
          else
               item.data('show', show.text());

          var statusmessage = $('status', data);
          if (statusmessage)
               item.data('statusmessage', statusmessage.text());
          else
               item.data('statusmessage', '');
     }
}
//--------------------------------------------------------------------------------------------