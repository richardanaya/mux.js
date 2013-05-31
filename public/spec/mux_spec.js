describe("Multiplex", function () {
    var flag;
    var mux;

    beforeEach(function () {
        mux = new Mux();
    });

    it("should be able process its own output", function () {
        var input = "Hello World!";
        var output;
        runs(function () {
            flag = false;
            mux.on("messageReceived", function(message){
                output = message;
                flag = true;
            });
            mux.on("requestSendData", function(data){
                console.log(data);
                mux.processData(data);
            });
            mux.send(input);
        });

        waitsFor(function () {
            return flag;
        }, "The message should have been processed.", 750);

        runs(function () {
            expect(output).toEqual(input);
        });
    });

    it("should be able process large input", function () {
        var input = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut eu est at mauris auctor tincidunt vel eget lorem. Duis et justo sed leo dignissim consequat. Donec elementum ipsum vitae mauris interdum vitae faucibus orci facilisis. Donec eu tortor metus, id mollis elit. Proin vulputate ligula sit amet quam mollis et venenatis eros lobortis. Phasellus varius orci accumsan est mollis ut sollicitudin est egestas. In tempor leo et nulla rhoncus at viverra neque accumsan. Nulla ac odio libero. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod diam et mauris blandit pellentesque. Proin aliquam, elit sed dapibus gravida, tellus justo semper tellus, id placerat elit metus in leo. Nullam lacinia placerat tincidunt. In sit amet pellentesque lectus.<br><br>Proin urna eros, dictum in blandit vitae, sodales a elit. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Nulla vitae neque a magna fringilla accumsan. Mauris sed augue sed elit scelerisque placerat. Vestibulum dolor tortor, iaculis et rhoncus rhoncus, sagittis eu diam. Nunc eget leo neque. Donec nunc libero, ultricies et eleifend id, pharetra id quam. Duis nisi ante, tempus vitae lacinia egestas, posuere sed nisi. Aliquam libero dolor, volutpat eget euismod eu, vehicula quis lectus. Integer suscipit dapibus diam ut tristique. Integer et dui elit. Vivamus dui magna, commodo nec accumsan non, consequat vitae est. Vestibulum vestibulum nunc ut est vulputate scelerisque. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; In facilisis porttitor semper. Duis sed dignissim ipsum.<br><br>Donec euismod orci quis leo feugiat tincidunt. Suspendisse potenti. Fusce enim arcu, tempus ac pretium condimentum, tincidunt nec magna. Quisque vitae nisl et magna vestibulum pharetra nec et erat. Praesent vel augue ut nibh elementum congue. Pellentesque accumsan, libero ac lobortis fermentum, ligula diam dapibus nisi, sit amet tincidunt mauris tellus in odio. Mauris et pharetra lectus. Suspendisse sed erat id risus dignissim fermentum et id velit. Vestibulum fermentum mi sit amet ante aliquam vel adipiscing justo pulvinar. Donec hendrerit rutrum posuere. Morbi adipiscing dignissim mauris ut pellentesque.<br><br>Quisque egestas lacinia orci, sit amet scelerisque sapien ultrices ut. Sed id nibh non dolor consequat accumsan sed ultrices ante. Phasellus id est diam, et condimentum ligula. Integer vel rutrum mi. Pellentesque sollicitudin, dui eu tempor varius, augue mauris venenatis dui, sit amet tincidunt sapien tortor et leo. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Curabitur ut ante non lorem tincidunt vehicula a aliquam ligula.<br><br>Quisque lacinia tristique eros, eget adipiscing eros pretium pulvinar. Phasellus at odio id purus consequat commodo. Phasellus lorem dolor, scelerisque eu mattis vitae, tincidunt non nulla. Morbi felis tortor, lacinia eget rhoncus eget, fringilla in massa. Vivamus porta lacinia aliquet. Donec pharetra lectus nec risus pulvinar et adipiscing massa interdum. Phasellus dui lorem, euismod id faucibus sed, elementum quis ipsum. Sed lacinia diam at justo tempor sed feugiat sem porttitor. Integer mattis massa dictum nulla laoreet vitae dictum leo malesuada. Vivamus vulputate fringilla libero vel semper. Nulla egestas fermentum convallis. Aliquam odio sapien, auctor sit amet molestie dictum, sagittis ut mi.';
        var output;
        runs(function () {
            flag = false;
            mux.on("messageReceived", function(message){
                output = message;
                flag = true;
            });
            mux.on("requestSendData", function(data){
                console.log(data);
                mux.processData(data);
            });
            mux.send(input);
        });

        waitsFor(function () {
            return flag;
        }, "The message should have been processed.", 750);

        runs(function () {
            expect(output).toEqual(input);
        });
    });
});