window.Mux = (function () {
    //base64 polyfill
    ;(function () {

        var
            object = typeof window != 'undefined' ? window : exports,
            chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
            INVALID_CHARACTER_ERR = (function () {
                // fabricate a suitable error object
                try { document.createElement('$'); }
                catch (error) { return error; }}());

        // encoder
        // [https://gist.github.com/999166] by [https://github.com/nignag]
        object.btoa || (
            object.btoa = function (input) {
                for (
                    // initialize result and counter
                    var block, charCode, idx = 0, map = chars, output = '';
                    // if the next input index does not exist:
                    //   change the mapping table to "="
                    //   check if d has no fractional digits
                    input.charAt(idx | 0) || (map = '=', idx % 1);
                    // "8 - idx % 1 * 8" generates the sequence 2, 4, 6, 8
                    output += map.charAt(63 & block >> 8 - idx % 1 * 8)
                    ) {
                    charCode = input.charCodeAt(idx += 3/4);
                    if (charCode > 0xFF) throw INVALID_CHARACTER_ERR;
                    block = block << 8 | charCode;
                }
                return output;
            });

        // decoder
        // [https://gist.github.com/1020396] by [https://github.com/atk]
        object.atob || (
            object.atob = function (input) {
                input = input.replace(/=+$/, '')
                if (input.length % 4 == 1) throw INVALID_CHARACTER_ERR;
                for (
                    // initialize result and counters
                    var bc = 0, bs, buffer, idx = 0, output = '';
                    // get next character
                    buffer = input.charAt(idx++);
                    // character found in table? initialize bit storage and add its ascii value;
                    ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
                        // and if not first of each 4 characters,
                        // convert the first 8 bits to one ascii character
                        bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
                    ) {
                    // try to find character in table (0-63, not found => -1)
                    buffer = chars.indexOf(buffer);
                }
                return output;
            });

    }());


    var Emitter = function () {
        this.channels = {};
    };

    Emitter.prototype.fire = function (channel) {
        var subscribers = this.channels[channel];
        if (!subscribers) {
            return;
        }
        var args = [];
        for (var i = 1; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        for (i = 0; i < subscribers.length; i++) {
            subscribers[i].apply(null, args);
        }
    };

    Emitter.prototype.pipe = function (sourceEmitter, channel) {
        var _this = this;
        sourceEmitter.on(channel, function () {
            var args = [channel];
            for(var i=0;i<arguments.length;i++){
                args.push(arguments[i]);
            }

            _this.fire.apply(_this, args);
        })
    };

    Emitter.prototype.on = function (channel, func) {
        var subscribers = this.channels[channel];
        if (!subscribers) {
            subscribers = [];
            this.channels[channel] = subscribers;
        }

        subscribers.push(func);
    };

    var Receiver = function () {
        Emitter.call(this);
        this.messageChunks = [];
    };
    Receiver.prototype = Object.create(Emitter.prototype);

    Receiver.prototype.checkComplete = function (id) {
        var message = "";
        var chunks = this.messageChunks[id];
        for (var i = 0; i < chunks.length; i++) {
            if (chunks[i] == null) {
                return;
            }
            message += chunks[i];
        }
        this.onMessageComplete(message);
        delete this.messageChunks[id];
    };

    Receiver.prototype.processMessageData = function (message) {
        message = window.atob(message);
        var idx = 0;
        while (idx < message.length) {
            var header = Message.readHeader(message.substr(idx, Message.CHUNK_HEADER_SIZE));
            if (!this.messageChunks[header.id]) {
                this.messageChunks[header.id] = [];
            }
            this.messageChunks[header.id][header.chunkNumber] = message.substr(idx + Message.CHUNK_HEADER_SIZE, header.size);
            if (header.complete) {
                this.checkComplete(header.id);
            }
            idx += Message.CHUNK_HEADER_SIZE + header.size;
        }
    };

    Receiver.prototype.onMessageComplete = function (message) {
        this.fire("messageReceived", message);
    };

    var Sender = function (maxSize) {
        this.messages = [];
        this.maxSize = maxSize;
    };

    Sender.prototype.queueMessage = function (message) {
        if (message.length == 0) {
            return;
        }
        this.messages.push(new Message(message));
    };

    Sender.prototype.createMessageData = function () {
        var messageData = "";
        //make room for base64ification
        var unusedSpace = Math.floor(this.maxSize/2);
        var messagesRemaining = this.messages.length;
        while (messagesRemaining != 0) {
            var targetSize = (unusedSpace - messagesRemaining * Message.CHUNK_HEADER_SIZE) / messagesRemaining;
            var message = this.messages[this.messages.length - messagesRemaining];
            var unchunkedAmount = message.size - message.amountChunked
            if (targetSize > unchunkedAmount) {
                targetSize = unchunkedAmount;
            }
            messageData += message.getMessageChunk(targetSize);
            unusedSpace -= targetSize + Message.CHUNK_HEADER_SIZE;
            if (message.complete) {
                this.messages.splice(this.messages.length - messagesRemaining, 1);
            }
            messagesRemaining--;
        }
        return window.btoa(messageData);
    };

    var Message = function (message) {
        this.id = Message.IDCount;
        Message.IDCount += 1;
        Message.IDCount %= 2147483647;
        this.currentChunk = 0;
        this.message = message;
        this.size = message.length;
        this.amountChunked = 0;
        this.complete = false;
    };

    Message.IDCount = 0;
    Message.CHUNK_HEADER_SIZE = 18;

    Message.prototype.getMessageChunk = function (size) {
        var chunk = this.message.substr(this.amountChunked, size);
        this.amountChunked += size;
        if (this.size == this.amountChunked) {
            this.complete = true;
        }
        var header = "";
        header += String.fromCharCode(Mux.VERSION);
        header += Util.int64ToString(this.id);
        header += Util.int32ToString(this.currentChunk);
        header += Util.int32ToString(size);
        var c = this.complete ? 1 : 0;
        header += String.fromCharCode(c);
        this.currentChunk++;
        return header + chunk;
    };

    Message.readHeader = function (str) {
        return {
            version: Util.stringToInt32(str.substr(0, 4)),
            id: Util.stringToInt64(str.substr(1, 8)),
            chunkNumber: Util.stringToInt32(str.substr(9, 4)),
            size: Util.stringToInt32(str.substr(13, 4)),
            complete: str.charCodeAt(17) == 1
        }
    };

    var Util = function () {
    };
    Util.int32ToString = function (num) {
        var byte0 = num >> 24;
        var byte1 = (num << 8) >> 24;
        var byte2 = (num << 16) >> 24;
        var byte3 = (num << 24) >> 24;
        if (byte0 < 0) {
            byte0 = 256 + byte0;
        }
        if (byte1 < 0) {
            byte1 = 256 + byte1;
        }
        if (byte2 < 0) {
            byte2 = 256 + byte2;
        }
        if (byte3 < 0) {
            byte3 = 256 + byte3;
        }
        return String.fromCharCode(byte0) + String.fromCharCode(byte1) + String.fromCharCode(byte2) + String.fromCharCode(byte3);
    }
    Util.stringToInt32 = function (str) {
        var byte0 = str.charCodeAt(0);
        var byte1 = str.charCodeAt(1);
        var byte2 = str.charCodeAt(2);
        var byte3 = str.charCodeAt(3);
        return byte0 << 24 | byte1 << 16 | byte2 << 8 | byte3;
    };

    Util.int64ToString = function (num) {
        var byte0 = num >> 56;
        var byte1 = (num << 8) >> 56;
        var byte2 = (num << 16) >> 56;
        var byte3 = (num << 24) >> 56;
        var byte4 = (num >> 32) >> 56;
        var byte5 = (num << 40) >> 56;
        var byte6 = (num << 48) >> 56;
        var byte7 = (num << 56) >> 56;
        if (byte0 < 0) {
            byte0 = 256 + byte0;
        }
        if (byte1 < 0) {
            byte1 = 256 + byte1;
        }
        if (byte2 < 0) {
            byte2 = 256 + byte2;
        }
        if (byte3 < 0) {
            byte3 = 256 + byte3;
        }
        if (byte4 < 0) {
            byte4 = 256 + byte4;
        }
        if (byte5 < 0) {
            byte5 = 256 + byte5;
        }
        if (byte6 < 0) {
            byte6 = 256 + byte6;
        }
        if (byte7 < 0) {
            byte7 = 256 + byte7;
        }
        return String.fromCharCode(byte0) + String.fromCharCode(byte1) + String.fromCharCode(byte2) + String.fromCharCode(byte3) + String.fromCharCode(byte4) + String.fromCharCode(byte5) + String.fromCharCode(byte6) + String.fromCharCode(byte7);
    }
    Util.stringToInt64 = function (str) {
        var byte0 = str.charCodeAt(0);
        var byte1 = str.charCodeAt(1);
        var byte2 = str.charCodeAt(2);
        var byte3 = str.charCodeAt(3);
        var byte4 = str.charCodeAt(4);
        var byte5 = str.charCodeAt(5);
        var byte6 = str.charCodeAt(6);
        var byte7 = str.charCodeAt(7);
        return byte0 << 56 | byte1 << 48 | byte2 << 40 | byte3 << 32 | byte4 << 24 | byte5 << 16 | byte6 << 8 | byte7;
    };

    var Mux = function (params) {
        Emitter.call(this);
        this.sendRate = 0;
        this.maxSize = 1000
        if(params){
            if(params.maxSize){
                this.maxSize = params.maxSize;
            }
            if(params.sendRate){
                this.sendRate = params.sendRate;
            }
        }
        this.receiver = new Receiver();
        this.pipe(this.receiver, "messageReceived");
        this.sender = new Sender(this.maxSize);
        this.isSending = false;
    };

    Mux.prototype = Object.create(Emitter.prototype);

    Mux.VERSION = 0;

    Mux.prototype.send = function (message) {
        this.sender.queueMessage(message);
        var _this = this;
        var checkSend = function(){
            _this.fire("requestSendData",_this.getNextData());
            if(_this.hasData()){
                setTimeout(checkSend,_this.sendRate);
            }
            else {
                this.isSending = false;
            }
        };
        if(!this.isSending){
            this.isSending = true;
            setTimeout(checkSend,_this.sendRate);
        }
    };

    Mux.prototype.hasData = function () {
        return this.sender.messages.length;
    };

    Mux.prototype.getNextData = function () {
        return this.sender.createMessageData();
    };

    Mux.prototype.processData = function (data) {
        this.receiver.processMessageData(data);
    };

    return Mux;
})();