var TRUE = true,
    FALSE = false,
    NULL = null,
    NULLOBJ = {},
    class_initializing = FALSE,
    class_fnTest = /0/.test(function() {
        0;
    }) ? /\b_super\b/ : /.*/,
    Observer,
    AbstractTask,
    Class = function() {};

// util
function is(key, vars) {
    return Object.prototype.toString.call(vars) == '[object ' + key + ']' ?
               TRUE : FALSE;
}
function isNumber(vars) {
    return is('Number', vars);
}
function isString(vars) {
    return is('String', vars);
}
function isArray(vars) {
    return is('Array', vars);
}
function isFunction(vars) {
    return is('Function', vars);
}
function isDefined(vars) {
    return vars === void 0 ? FALSE : TRUE;
}

function proxy(target, func) {
    return function() {
        return func.apply(target, arguments);
    };
}
function toArray(obj/* varless */, ary) {
    /* var ary = []; */
    ary = [];

    ary.push.apply(ary, obj);

    return ary;
}
function copyArray(ary) {
    return isArray(ary) ? ary.slice(0) : ary;
}

function deleteArrayKey(ary, no) {
    ary.splice(no, 1);
}
function bindOnProp(that, config /* varless */, i, temp) {
    // var i,
    //     temp;

    for (i in config) {
        if (temp = i.match(/^on(.+)$/)) {
            that['on'](temp[1], config[i]);
        }
    }
}
function hasDeclaredArgument(func) {
    return !!(isFunction(func) && func.length);
}

function fire_complete(that) {
    that['fire']('complete');
}
function fire_nexttask(that) {
    that['fire']('nexttask');
}
function fire_start(that) {
    that['fire']('start');
}
function fire_progress(that) {
    that['fire']('progress');
}

Class['extend'] = function(props/* varless */, SuperClass, i) {
    // var SuperClass = this,
    //     i;
    SuperClass = this;

    function Class() {
        if (!class_initializing && this['init']) {
            this['init'].apply(this, arguments);
        }
    }

    class_initializing = TRUE;
    Class.prototype = new SuperClass();
    class_initializing = FALSE;

    Class.prototype['constructor'] = Class;

    for (i in props) {
        if (props.hasOwnProperty(i)) {
            addMethod(i);
        }
    }

    function addMethod(key) {
        var prop = props[key],
            _super = SuperClass.prototype[key],
            isMethodOverride = (
                isFunction(prop) &&
                isFunction(_super) &&
                class_fnTest.test(prop)
            );

        if (isMethodOverride) {
            Class.prototype[key] = function() {
                var that = this,
                    ret,
                    tmp = that['_super'];

                that['_super'] = _super;

                ret = prop.apply(that, arguments);

                that['_super'] = tmp;

                return ret;
            };
        }
        else {
            Class.prototype[key] = prop;
        }
    }

    Class['extend'] = SuperClass['extend'];

    return Class;
};

function classExtend(cls, prop, support /* varless */, klass) {
    cls = cls || Class;

    /* var klass = cls['extend'](prop); */
    klass = cls['extend'](prop);

    if (isDefined(support)) {
        klass['support'] = support;
    }

    return klass;
}
function classExtendObserver(prop, support) {
    return classExtend(Observer, prop, support);
}

Observer = classExtend(NULL, {
    'dispose': function(/* varless */ that, i, temp) {
        that = this;

        for (i in that) {
            temp = that[i];

            if (temp && temp['dispose']) {
                temp['dispose']();
            }
        }

        that.__proto__ = NULL;

        for (i in that) {
            that[i] = NULL;
            delete that[i];
        }
    },
    'init': function() {
        this._observed = {};
        this._childs = [];
    },
    'on': function(key, func /* varless */, that, observed) {
        that = this;
        observed = that._observed;

        if (!observed[key]) {
            observed[key] = [];
        }

        observed[key].push(func);
    },
    'one': function(key, func /* varless */, that, wrap) {
        /* var that = this; */
        that = this;
        wrap = function(vars) {
            func.apply(that, vars);
            that['off'](key, wrap);
        };

        wrap.original = func;

        that['on'](key, wrap);
    },
    'off': function(key, func /* varless */, that, observed, target, i) {
        // var observed = that._observed,
        //     target = observed[key],
        //     i;
        that = this;
        observed = that._observed;

        if (func) {
            target = observed[key];

            if (target) {
                for (i = target.length; i--;) {
                    if (func == target[i] || func == target[i].original) {
                        deleteArrayKey(target, i);

                        if (target.length == 0) {
                            delete observed[key];
                        }

                        return TRUE;
                    }
                }
            }

            return FALSE;
        }

        return delete observed[key];
    },
    'fire': Observer_bubble,
    'bubble': Observer_bubble,
    'capture': function() {
        var that = this,
            args = arguments,
            childs = that._childs,
            i = childs.length,
            temp;

        if (FALSE !== that['only'].apply(that, args)) {
            for (; i--;) {
                temp = childs[i];
                temp['capture'].apply(temp, args);
            }
        }
    },
    'only': function() {
        var args = toArray(arguments),
            e = Observer_event(this, args),
            target = this._observed[e['type']] || [],
            temp,
            i = target.length;

        deleteArrayKey(args, 0);
        args[args.length] = e;

        for (; i--;) {
            temp = target[i];
            if (temp) {
                temp = temp.apply(this, args);

                if (temp === FALSE || e._flgPreventDefault) {
                    return temp;
                }
            }
        }

        return e;
    },
    'addChild': function(instance) {
        if (instance._parentObserver) {
            instance._parentObserver['removeChild'](instance);
        }

        instance._parentObserver = this;
        this._childs.push(instance);
    },
    'removeChild': function(instance) {
        var childs = this._childs,
            i = childs.length;

        if (instance) {
            for (; i--; ) {
                if (childs[i] === instance) {
                    Observer_removeChildExe(childs, i);

                    return;
                }
            }
        }
        else {
            for (; i--; ) {
                Observer_removeChildExe(childs, i);
            }
        }
    }
});

function Observer_removeChildExe(childs, i) {
    delete childs[i]._parentObserver;
    deleteArrayKey(childs, i);
}
function Observer_bubble() {
    var that = this,
        args = arguments,
        temp = that['only'].apply(that, args);

    if (FALSE !== temp && !(temp || NULLOBJ)._flgStopPropagation) {
        /* that._parentFire.apply(that, args); */
        temp = this._parentObserver;

        if (temp) {
            temp['bubble'].apply(temp, args);
        }
    }
}
function Observer_preventDefault() {
    this._flgPreventDefault = TRUE;
}
function Observer_stopPropagation() {
    this._flgStopPropagation = TRUE;
}
function Observer_event(that, args /* varless */, e) {
    e = args[0];

    if (isString(e)) {
        e = {
            'type': e,
            'arguments': args,
            _flgPreventDefault: FALSE,
            _flgStopPropagation: FALSE,
            'preventDefault': Observer_preventDefault,
            'stopPropagation': Observer_stopPropagation
        };
    }

    e['before'] = e['target'];
    e['target'] = that;

    return e;
}

AbstractTask = classExtendObserver({
    'init': function(config/* varless */, that, queue) {
        that = this;

        that['_super']();

        config = config || NULLOBJ;

        /* var queue = copyArray(config['queue']) || []; */
        queue = copyArray(config['queue']) || [];

        bindOnProp(that, config);

        that['resetQueue'](queue);
        that['done'] = proxy(that, that['done']);
    },
    'start': function(/* varless */that) {
        that = this;

        fire_start(that);
        that['paused'] = FALSE;
        that._exeQueue();
    },
    'restart': function(queue) {
        this['resetQueue'](queue);
        this['start']();
    },
    'stop': function() {
        this._queue = NULL;
        this['fire']('stop');
    },
    'pause': function() {
        this['paused'] = TRUE;
        this['fire']('pause');
    },
    'resume': function(/* varles */that) {
        that = this;

        if (that['paused']) {
            that['fire']('resume');
            that['paused'] = FALSE;
            that._exeQueue();
        }
    },
    'resetQueue': function(queue/* varless */, that, i) {
        that = this;

        if (queue) {
            that._orgqueue = copyArray(queue);
        }

        var _queue = that._queue = copyArray(that._orgqueue);

        for (i in _queue) {
            if (_queue[i]['resetQueue']) {
                _queue[i]['resetQueue']();
            }
        }

        that['fire']('reset');
    },
    _noticeChange: function() {
        this['fire']('change', this['getQueue']());
    },
    'setQueue': function(queue) {
        this._queue = copyArray(queue);
        this._noticeChange();
    },
    'getQueue': function() {
        return copyArray(this._queue);
    },
    'addTask': function(task, priority/* varless */, that) {
        that = this;

        if (
            !isNumber(priority) ||
            priority > that._queue.length
        ) {
            priority = that._queue.length;
        }

        that._queue.splice(priority, 0, task);

        that._noticeChange();
    },
    'removeTask': function(task/* varless */, that, i, len) {
        that = this;

        // var i = 0,
        //     len = that._queue.length;
        i = 0,
        len = that._queue.length;

        for (; i < len; i++ ) {
            if (that._queue[i] === task) {
                deleteArrayKey(that._queue, i);
                that._noticeChange();

                break;
            }
        }
    },
    _exeQueue: function() {
        if (!this['paused']) {
            this['exe']();
        }
    },
    'exe': function(/* varless */that, task, func) {
        that = this;
        task = that._queue.shift();

        if (task) {
            if (task['one'] && task['start']) {
                task['one']('nexttask', that['done']);
                func = proxy(task, task['start']);
            }
            else if (hasDeclaredArgument(task)) {
                func = proxy(that, task);
            }
            else {
                func = function(done) {
                    task.call(that);
                    done();
                };
            }

            return func(that['done']);
        }
    } //,
    /* 'done': abstraceFunction */
});

AbstractTask['Parallel'] = AbstractTask['Async'] = classExtend(AbstractTask, {
    'exe': function(/* varless */that) {
        that = this;

        if (that._queue) {
            if (!that._queue.length) {
                fire_complete(that);
                return fire_nexttask(that);
            }

            that._processcount = that._queue.length;

            while (!that['paused'] && that._queue && that._queue[0]) {
                that['_super']();
            }
        }
    },
    'done': function(/* varless */that) {
        that = this;

        fire_progress(that);
        that._processcount--;

        if (!that._processcount) {
            fire_complete(that);
            fire_nexttask(that);
        }
    }
});
AbstractTask['Serial'] = AbstractTask['Sync'] = classExtend(AbstractTask, {
    'exe': function(/* varless */that) {
        that = this;

        if (that._queue && !that['paused']) {
            if (that._queue[0]) {
                /* return that._asyncAction(that._queue.shift())((that['done'])); */
                return that['_super']();
            }

            fire_complete(that);
            fire_nexttask(that);
        }
    },
    'done': function() {
        fire_progress(this);
        this['exe']();
    }
});

// window.Done = AbstractTask
Done = AbstractTask;
