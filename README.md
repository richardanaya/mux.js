Mux.js
=======

Mux.js is a tool for multiplexing messages across a network.  The main reasons you'd want to do this:

* Your communication tech might be only able to send so many bytes per packet
* You might want to send multiple messages in parallel so big messages don't clog up communication
* Combine small messages into one packet if space is available to reduce packets sent


What's going on:
----
Let's quickly explain how this works.  The main process is that we take a queue of messages, and break them apart and combine them with parts of other messages to send across the wire.  The receiving end will be gathering data until a full formed message is gathered on the other side.

![ScreenShot](http://i.imgur.com/cMrBGkR.png)

Mux.js is largely setup to be self sufficient, you need only give Mux.js your messages in string form, and it will notify you when to pump data cross a wire, and will notify you with events when complete messages are formed on the other side.

![ScreenShot](http://i.imgur.com/AyYLyj7.png)

Example Usage:
----

``` javascript
//CLIENT

//making a mux for at transport that can only send 1000 bytes at a time
var mux = new Mux({maxSize: 1000});  
mux.on("requestSendData", function(data){
  //send the data to the server
  socket.send(data);
});
mux.send("Hello World!");
mux.send("ABC");
mux.send("123");

//SERVER

var mux = new Mux({maxSize: 1000});  
mux.on("messageRecieved", function(message){ 
  //do something when a complete message is received!
  console.log(message);
});

socket.on('data', function(data){
  //process data from across the wire
  mux.processData(data);
});
```

Important Notes:
----
* Currently only works with ASCII strings only
* No support for handling dropped messages
* Message ordering is not guaranteed
* The data that is passed around is base64 data
