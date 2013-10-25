describe('Doneは', function() {
    var task;

    beforeEach(function() {
        // init
        task = new Done({
        });
    });
    afterEach(function() {
        // clear
        if (task.dispose) {
            task.dispose();
        }
    });

    it('.extend(prop)でクラスを作成する', function() {
        var initcount = 0,
            method1count = 0,
            Test = Done.extend({
                init: function(num) {
                    initcount += num;
                },
                method1: function() {
                    method1count++;
                }
            }),
            test = new Test(1);

        expect(initcount).to.be(1);
        test.method1();
        expect(method1count).to.be(1);
        test.method1();
        expect(method1count).to.be(2);
    });

    it('initは省略できる', function() {
        var method1count = 0,
            Test = Done.extend({
                method1: function() {
                    method1count++;
                }
            }),
            test = new Test(1);

        test.method1();
        expect(method1count).to.be(1);
        test.method1();
        expect(method1count).to.be(2);
    });

    it('extend()で作成したクラスはextend()を持つ', function() {
        var method1count = 0,
            method2count = 0,
            method3count = 0,
            Test1 = Done.extend({
                method1: function() {
                    method1count += 1;
                },
                method2: function() {
                    method2count += 1;
                },
                method3: function() {
                    method3count += 1;
                }
            }),
            Test2 = Test1.extend({
                method1: function() {
                    method1count += 2;
                },
                method2: function() {
                    method2count += 2;
                    this._super();
                }
            }),
            test2 = new Test2();

        test2.method1();
        test2.method2();
        test2.method3();

        expect(method1count).to.be(2);
        expect(method2count).to.be(3);
        expect(method3count).to.be(1);
    });
    it('dispose()でプロパティとメソッドを破棄し、メモリーを解放する', function() {
        console.dir(task);
        task.test1 = 1;
        task.test2 = '2';
        task.test3 = {};
        task.test4 = function() {};
        task.dispose();
        expect(task).to.eql({});
        expect(task.dispose).to.be(undefined);
    });

    it('on()でイベントを登録する', function() {
        var count = 0,
            dammy = function() {
                count++;
            };

        task.on('test', dammy);
        task.on('test', dammy);
        task.on('test1', function() {
            count += 3;
        });

        task.emit('test');
        expect(count).to.be(2);

        task.emit('test1');
        expect(count).to.be(5);
    });

    it('one()で一度のみ発火するイベントを登録する', function() {
        var count = 0,
            args = {
                one: function() {
                    count++;
                }
            };

        task.one('one', args.one);
        task.emit('one');
        task.emit('one');

        expect(count).to.be(1);

        task.one('one', args.one);
        task.off('one', args.one);
        task.emit('one');

        expect(count).to.be(1);
    });

    it('off()でイベントを削除する', function() {
        var count = 0,
            dammy1 = function() {
                count++;
            };

        task.on('test', dammy1);
        task.off('test');

        task.emit('test');

        expect(count).to.be(0);
    });

    it('emit()でイベントを発火する', function() {
        var ret1 = 0,
            dammy1 = function() {
                ret1++;
            },
            ret2 = 0,
            dammy2 = function() {
                ret2++;
            };

        task.on('test1', dammy1);
        task.on('test2', dammy2);

        task.emit('test1');

        expect(ret1).to.be(1);
        expect(ret2).to.be(0);

        task.emit('test2');

        expect(ret1).to.be(1);
        expect(ret2).to.be(1);

        task.on('test1', dammy2);

        task.emit('test1');

        expect(ret1).to.be(2);
        expect(ret2).to.be(2);

        task.emit('test2');

        expect(ret1).to.be(2);
        expect(ret2).to.be(3);

        task.on('test3', function(ev, arg1) {
            expect(ev).to.be.a('object');
            expect(arg1).to.be(1);
        });

        task.emit('test3', 1);
    });

    it('bubble()はemitのエイリアスである', function() {
        expect(task.emit).to.be(task.bubble);
    });

    it('addChild(instance)はDoneのインスタンスを子供として登録する。', function() {
        var ret = [],
            child1 = new Done,
            child2 = new Done;

        task.addChild(child1);
        child1.addChild(child2);

        task.on('test', function(ev, num) {
            expect(num).to.be(123);
            ret.push(0);
        });
        child1.on('test', function(ev, num) {
            expect(num).to.be(123);
            ret.push(1);
        });
        child2.on('test', function(ev, num) {
            expect(num).to.be(123);
            ret.push(2);
        });

        child2.emit('test', 123);

        expect(ret).to.eql([2, 1, 0]);
    });

    it('capture()は親から子にイベントを伝播する', function() {
        var ret = [],
            child1 = new Done,
            child2 = new Done;

        task.addChild(child1);
        child1.addChild(child2);

        task.on('test', function(ev, num) {
            expect(num).to.be(123);
            ret.push(0);
        });
        child1.on('test', function(ev, num) {
            expect(num).to.be(123);
            ret.push(1);
        });
        child2.on('test', function(ev, num) {
            expect(num).to.be(123);
            ret.push(2);
        });

        task.capture('test', 123);

        expect(ret).to.eql([0, 1, 2]);
    });

    it('removeChild([instance])は子供を削除する。instanceを省略した場合、すべての子供を削除する。', function() {
        var ret = [],
            child1 = new Done,
            child2 = new Done;

        task.addChild(child1);
        child1.addChild(child2);

        task.on('test', function(ev, num) {
            expect(num).to.be(123);
            ret.push(0);
        });
        child1.on('test', function(ev, num) {
            expect(num).to.be(123);
            ret.push(1);
        });
        child2.on('test', function(ev, num) {
            expect(num).to.be(123);
            ret.push(2);
        });

        task.removeChild(child1);

        child2.emit('test', 123);

        expect(ret).to.eql([2, 1]);

        child1.removeChild();
        child2.emit('test', 123);

        expect(ret).to.eql([2, 1, 2]);
    });

    it('only()は親、子にイベントを伝播せず実行する', function() {
        var ret = [],
            child1 = new Done,
            child2 = new Done;

        task.addChild(child1);
        child1.addChild(child2);

        task.on('test', function(ev, num) {
            expect(num).to.be(123);
            ret.push(0);
        });
        child1.on('test', function(ev, num) {
            expect(num).to.be(123);
            ret.push(1);
        });
        child2.on('test', function(ev, num) {
            expect(num).to.be(123);
            ret.push(2);
        });

        child2.only('test', 123);

        expect(ret).to.eql([2]);
    });

    it('on(event, func)で登録したfuncの引数の最後に追加して渡される値はeventオブジェクトである。', function() {
        var ret = [],
            child1 = new Done,
            child2 = new Done;

        task.addChild(child1);
        child1.addChild(child2);

        task.on('test', function(ev, num) {
            expect(num).to.be(123);
            ret.push(0);
        });
        task.on('test', function(ev, num) {
            ev.preventDefault();
            ret.push(1);
        });
        child1.on('test', function(ev, num) {
            expect(num).to.be(123);
            ret.push(2);
        });
        child2.on('test', function(ev, num) {
            ev.stopPropagation();

            expect(num).to.be(123);
            ret.push(3);
        });
        child2.on('test', function(ev, num) {
            ev.stopPropagation();

            expect(num).to.be(123);
            ret.push(4);
        });

        child2.emit('test', 123);
        expect(ret).to.eql([4, 3]);

        ret = [];

        task.capture('test', 123);
        expect(ret).to.eql([1, 2, 4, 3]);
    });

    it('Doneを拡張して独自のタスククラスを作成する', function(done) {
        var ret = [],
            Custom = Done.extend({
                'exe': function() {
                    var queue = this.getQueue();

                    if (queue.length) {
                        return this._super();
                    }

                    this.emit('complete');
                    this.emit('nexttask');
                },
                'done': function() {
                    this.emit('progress');
                    this['exe']();
                }
            }),
            custom = new Custom({
                queue: [
                    function() {
                    },
                    function() {
                    },
                    function() {
                    }
                ],
                oncomplete: function() {
                    expect(ret).to.eql([1, 1, 1]);

                    done();
                },
                onprogress: function() {
                    ret.push(1);
                }
            });

        custom.start();
    });
});
