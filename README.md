# Done.js
同期、非同期の処理をわかりやすく扱えるライブラリ。


[![Build Status](https://travis-ci.org/AtsushiM/done.js.png?branch=master)](https://travis-ci.org/AtsushiM/done.js)


## Usage
### インスタンスを作成する
```javascript
var sync = new Done.Sync(); // 同期処理
var async = new Done.Async(); // 非同期処理
var serial = new Done.Serial(); // Serial === Sync
var parallel = new Done.Parallel(); // Parallel === Async

sync = new Done.Sync({
    queue: [
        function() {
            // write code.
        },
        async,
        function (done) {
            // execute next task.
            setTimeout(function() {
                done();
            }, 1000);
        },
        serial
    ],
    onprogress: function() {
        // write code.
    },
    oncomplete: function() {
        // wirte code.
    }
});

sync.start(); // 処理開始
```

### インスタンスにイベントを登録する
```javascript
sync.on('event-name', function(arg1, arg2, arg3) {
    // write code.
});
async.one('event-name', function(arg1, arg2, arg3) {
    // write code.
}); // 1度だけ実行される
```

### 登録されたイベントを解除する
```javascript
sync.off('event-name', eventfunction);
async.off('event-name'); // 全てのイベントを解除する
```

### インスタンスに登録されたイベントを実行する
```javascript
sync.fire('event-name', arg1, arg2, arg3);
```

### キューにタスクを追加する
```javascript
var task = function(){
    // write code.
};
sync.addTask(task);
async.addTask(task, 0); // 第二引数で優先度を決定する。数値が低いほど優先される

sync.removeTask(task); // 削除
```

### キューを入れ替える
```javascript
sync.setQueue([function1, function2, function3]);
```

### キューを取得する
```javascript
sync.getQueue();
```

### キューをリセットする
```javascript
sync.resetQueue();

sync.resetQueue([function1]); // 引数をデフォルトに設定してリセットする

sync.restart(); // リセットしてstart()
```

### キューを停止する
```javascript
sync.pause(); // 一時停止
sync.resume(); // 再開

sync.stop(); // 停止
```

### インスタンスを削除し、メモリを開放する
```javascript
sync.dispose();
```

### 継承する
```javascript
var ExtendSync = Done.Sync.extend({
        init: function(config) {
            // write init code.
        },
        method1: function() {
            // write method.
        },
        on: function() {
            // override method.

            // call super method.
            this._super.apply(this, arguments);
        },
    });

// 独自のタスク処理を作成する
var ExtendDone = Done.extend({
        exe: function() {
            // write code.

            // this.paused : pause()で一時停止されているか否か
            // this._super()でキューに追加された一番最初のタスクを実行する

            // sample
            var queue = this.getQueue();

            if (!this.paused) {
                if (queue && queue.length) {
                    this._super();
                }
                else {
                    this.fire('complete');
                    this.fire('nexttask');
                }
            }
        },
        done: function() {
            // write code.
            this.fire('progress');
            this.exe();
        }
    });
```

## More
このライブラリはCIR.jsのC.Async, C.Syncを切り出したものです。

http://atsushim.github.io/cir.js/#Async
http://atsushim.github.io/cir.js/#Sync
