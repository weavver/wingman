Weavver Wingman
========
License: MIT
Status: Alpha

Wingman is an HTML/XMPP powered dashboard for chat, managing phone calls, and communicating with website visitors.

Installation:

1. Wingman uses HTTP-BIND to connect to your XMPP server (we test with eJabberd).  
--- https://git.process-one.net/ejabberd/mainline/blobs/raw/v2.1.11/doc/guide.html#htoc44

2. Configure the config.js file in the scripts folder.

3. Open dashboard.html

Note: To avoid cross-domain security issues access the html files from a url such as http://localhost/wingman/dashboard.html instead of the file path (file://c:/wingman/dashboard.html)

For more information: www.weavver.com/products/wingman

Author: Weavver, Inc./Mitchel Constantin <mythicalbox@weavver.com>  
Company Website: www.weavver.com  
External Libraries: JsJAC, moment.js, ckeditor, jquery