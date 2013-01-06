//--------------------------------------------------------------------------------------------
if (!String.prototype.trim) {
     String.prototype.trim = function () { return this.replace(/^\s\s*/, '').replace(/\s\s*$/, ''); };
}
//--------------------------------------------------------------------------------------------
function assertRosterItem(id) {
     // values: jid, label, status, avatarpath, presweight, bordercolor

     if (id.length == 0)
          return;

     var existingItem = $('#' + escapeId(id));
     if (existingItem.length)
          return existingItem;

     var item = itemTemplate.clone();
     item.data('show', 'offline');
     item.css('float', $(document).data('liststyle'));

     item.bind("changeData", function (elem, key, data) {
          switch (key) {
               case "agentmode":
                    var agentmode = $('.agentmode', this);
                    var mode = (data == 'on') ? '' : 'none';
                    agentmode.css('display', mode);
                    break;

               case "avatarpath":
                    var avatarImg = $('.avatar_image', this);
                    avatarImg.attr('src', 'images/avatar.png');
                    break;

               case "label":
                    var label = $('.label', this);
                    label.attr('id', 'label');
                    label.attr('title', 'Resource Priority ' + $(this).data('presweight'));
                    label.attr('class', 'label');
                    label.html('<NOBR>' + data + '</NOBR>');

                    //insertSorted($(this));
                    break;

               case "id":
                    $(this).attr('id', escapeId(data));
                    $(this).attr('title', "Id: " + escapeId(data));
                    break;

               case "show":
                    var img = $('.show_img', this);
                    if (data == 'online') {
                         //img.attr('src', 'bullet_ball_glass_green_shadow.png');
                         $('.left', '#Roster').children().css('background-color', 'green');
                    }
                    else if (data == 'away') {
                         //img.attr('src', 'bullet_ball_glass_blue_shadow.png');
                         $('.left', '#Roster').children().css('background-color', 'blue');
                    }
                    else if (data == 'dnd') {
                         //img.attr('src', 'bullet_ball_glass_red_shadow.png');
                         $('.left', '#Roster').children().css('background-color', 'red');
                    }
                    else if (data == 'offline') {
                         //img.attr('src', 'bullet_ball_glass_grey_shadow.png');
                         $('.left', '#Roster').children().css('background-color', 'grey');
                    }
                    break;

               case "priority":
                    // resort?
                    break;

               case "statusmessage":
                    var msg = $('.statusmessage', this);
                    msg.html('<NOBR>' + data + '</NOBR>');
                    break;

               case "isonthephone":
                    if (data == true) {
                         // html += '<div class="avatar" onclick="javascript:RosterPhone_Click();">'; 
                         // html += '<img id="' + divIdName + '_phone" RosterItemId="' + item.id + '" src="file://C:/Weavver/Snap/trunk/Dialer/Resources/RosterPhone.png" style="height: 30px; padding-top: 3px; visibility:hidden;">'; 
                         // html += '</div>'; 


                         if (window.external)
                              window.external.ShowPhoneMenu(GetRosterItemId(window.event.srcElement));
                    }
                    break;

               case "bordercolor":
                    item.css('borderLeft', '10px solid ' + item.bordercolor);
                    break;
          }
          insertSorted(item);
     });

     item.hover(
               function () {
                    $(this).removeClass("RosterItem");
                    $(this).addClass("RosterItemOver");
               },
               function () {
                    $(this).removeClass("RosterItemOver");
                    $(this).addClass("RosterItem");
               }
     );

     item.click(function () {
          //if (window.external)
          //window.external.ShowRosterMenu($(this).data('id'));
     });

     item.dblclick(function () {
          assertChat($(this).data('id'));
          return false;
     });

     item.data('id', id);
     item.data('label', id);
     item.css('display', '');

     if ($("#Roster").length) {
          //$("#Roster").append(item);
          insertSorted(item);
     }

     console.log(item);
     return item;
}