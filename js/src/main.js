// Generated by CoffeeScript 1.6.3
var AbstractTask, Class, FALSE, NULL, NULLOBJ, Observer, Observer_bubble, Observer_event, Observer_preventDefault, Observer_removeChildExe, Observer_stopPropagation, TRUE, bindOnProp, classExtend, classExtendObserver, class_fnTest, class_initializing, copyArray, deleteArrayKey, emit_complete, emit_nexttask, emit_progress, emit_start, hasDeclaredArgument, isArray, isDefined, isFunction, isNumber, isString, ns, proxy, toArray, _is,
  __hasProp = {}.hasOwnProperty;

ns = (function() {
  if (typeof module === 'undefined') {
    return window;
  }
  return module['exports'];
})();

TRUE = true;

FALSE = false;

NULL = null;

NULLOBJ = {};

class_initializing = FALSE;

class_fnTest = /0/.test(function() {
  0;
}) ? /\b_super\b/ : /.*/;

Class = function() {};

_is = function(key, vars) {
  if (Object.prototype.toString.call(vars) === '[object ' + key + ']') {
    return TRUE;
  } else {
    return FALSE;
  }
};

isNumber = function(vars) {
  return _is('Number', vars);
};

isString = function(vars) {
  return _is('String', vars);
};

isArray = function(vars) {
  return _is('Array', vars);
};

isFunction = function(vars) {
  return _is('Function', vars);
};

isDefined = function(vars) {
  if (vars === void 0) {
    return FALSE;
  } else {
    return TRUE;
  }
};

proxy = function(target, func) {
  return function() {
    return func.apply(target, arguments);
  };
};

toArray = function(obj) {
  var ary;
  ary = [];
  ary.push.apply(ary, obj);
  return ary;
};

copyArray = function(ary) {
  if (isArray(ary)) {
    return ary.slice(0);
  } else {
    return ary;
  }
};

deleteArrayKey = function(array, key) {
  array.splice(key, 1);
};

bindOnProp = function(that, config) {
  var i, temp, val;
  for (i in config) {
    val = config[i];
    if (temp = i.match(/^on(.+)$/)) {
      that['on'](temp[1], val);
    }
  }
};

hasDeclaredArgument = function(func) {
  return !!(isFunction(func) && func.length);
};

emit_complete = function(that) {
  that['emit']('complete');
};

emit_nexttask = function(that) {
  that['emit']('nexttask');
};

emit_start = function(that) {
  that['emit']('start');
};

emit_progress = function(that) {
  that['emit']('progress');
};

Class['extend'] = function(props) {
  var SuperClass, addMethod, i;
  SuperClass = this;
  Class = function() {
    if (!class_initializing && this['init']) {
      this['init'].apply(this, arguments);
    }
  };
  addMethod = function(key) {
    var isMethodOverride, prop, _super;
    prop = props[key];
    _super = SuperClass.prototype[key];
    isMethodOverride = isFunction(prop) && isFunction(_super) && class_fnTest.test(prop);
    if (isMethodOverride) {
      return Class.prototype[key] = function() {
        var ret, temp;
        temp = this['_super'];
        this['_super'] = _super;
        ret = prop.apply(this, arguments);
        this['_super'] = temp;
        return ret;
      };
    } else {
      Class.prototype[key] = prop;
    }
  };
  class_initializing = TRUE;
  Class.prototype = new SuperClass;
  class_initializing = FALSE;
  Class.prototype['constructor'] = Class;
  for (i in props) {
    if (!__hasProp.call(props, i)) continue;
    addMethod(i);
  }
  Class['extend'] = SuperClass['extend'];
  return Class;
};

classExtend = function(cls, prop, support) {
  var klass;
  cls = cls || Class;
  klass = cls['extend'](prop);
  if (isDefined(support)) {
    klass['support'] = support;
  }
  return klass;
};

classExtendObserver = function(prop, support) {
  return classExtend(Observer, prop, support);
};

Observer_removeChildExe = function(childs, i) {
  delete childs[i]._parentObserver;
  deleteArrayKey(childs, i);
};

Observer_bubble = function() {
  var args, temp;
  args = toArray(arguments || []);
  temp = this['only'].apply(this, args);
  if (FALSE !== temp && !(temp || {})._flgStopPropagation) {
    temp = this._parentObserver;
    if (temp) {
      temp['bubble'].apply(temp, args);
    }
  }
};

Observer_preventDefault = function() {
  return this._flgPreventDefault = TRUE;
};

Observer_stopPropagation = function() {
  return this._flgStopPropagation = TRUE;
};

Observer_event = function(that, args) {
  var e;
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
};

Observer = Class['extend']({
  'init': function() {
    this._observed = {};
    return this._childs = [];
  },
  'dispose': function() {
    var i, temp;
    this['removeChild'];
    for (i in this) {
      temp = this[i];
      if (temp && temp['dispose']) {
        temp['dispose'];
      }
    }
    this['__proto__'] = null;
    for (i in this) {
      this[i] = null;
      delete this[i];
    }
  },
  'on': function(key, func) {
    var observed;
    observed = this._observed;
    if (!observed[key]) {
      observed[key] = [];
    }
    observed[key].push(func);
  },
  'one': function(key, func) {
    var wrap,
      _this = this;
    wrap = function() {
      func.apply(_this, arguments);
      _this['off'](key, wrap);
    };
    wrap.original = func;
    this['on'](key, wrap);
  },
  'off': function(key, func) {
    var i, observed, target, val, _i;
    observed = this._observed;
    if (func) {
      target = observed[key];
      if (target) {
        for (i = _i = target.length - 1; _i >= 0; i = _i += -1) {
          val = target[i];
          if (func === val || func === val.original) {
            deleteArrayKey(target, i);
            if (target.length === 0) {
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
  'emit': Observer_bubble,
  'bubble': Observer_bubble,
  'capture': function() {
    var args, childs, val, _i;
    args = arguments;
    childs = this._childs;
    if (FALSE !== this['only'].apply(this, args)) {
      for (_i = childs.length - 1; _i >= 0; _i += -1) {
        val = childs[_i];
        val['capture'].apply(val, args);
      }
    }
  },
  'only': function() {
    var args, e, target, val, _i;
    args = toArray(arguments);
    e = Observer_event(this, args);
    target = this._observed[e['type']] || [];
    deleteArrayKey(args, 0);
    args[args.length] = e;
    for (_i = target.length - 1; _i >= 0; _i += -1) {
      val = target[_i];
      if (val) {
        val = val.apply(this, args);
        if (val === FALSE || e._flgPreventDefault) {
          return val;
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
    var childs, i, val, _i, _j;
    childs = this._childs;
    if (instance) {
      for (i = _i = childs.length - 1; _i >= 0; i = _i += -1) {
        val = childs[i];
        if (childs[i] === instance) {
          Observer_removeChildExe(childs, i);
          return;
        }
      }
    } else {
      for (i = _j = childs.length - 1; _j >= 0; i = _j += -1) {
        val = childs[i];
        Observer_removeChildExe(childs, i);
      }
    }
  }
});

AbstractTask = classExtendObserver({
  'init': function(config) {
    var queue;
    this['_super']();
    config = config || NULLOBJ;
    queue = copyArray(config['queue'] || []);
    bindOnProp(this, config);
    this['resetQueue'](queue);
    this['done'] = proxy(this, this['done']);
  },
  'start': function() {
    emit_start(this);
    this['paused'] = FALSE;
    this._exeQueue();
  },
  'restart': function(queue) {
    this['resetQueue'](queue);
    this['start']();
  },
  'stop': function() {
    this._queue = NULL;
    this['emit']('stop');
  },
  'pause': function() {
    this['paused'] = TRUE;
    this['emit']('pause');
  },
  'resume': function() {
    if (this['paused']) {
      this['emit']('resume');
      this['paused'] = FALSE;
      this._exeQueue();
    }
  },
  'resetQueue': function(queue) {
    var i, _queue;
    if (queue) {
      this._orgqueue = copyArray(queue);
    }
    _queue = this._queue = copyArray(this._orgqueue);
    for (i in _queue) {
      if (_queue[i]['resetQueue']) {
        _queue[i]['resetQueue']();
      }
    }
    this['emit']('reset');
  },
  _noticeChange: function() {
    this['emit']('change', this['getQueue']());
  },
  'setQueue': function(queue) {
    this._queue = copyArray(queue);
    this._noticeChange();
  },
  'getQueue': function() {
    return copyArray(this._queue);
  },
  'addTask': function(task, priority) {
    if (!isNumber(priority) || priority > this._queue.length) {
      priority = this._queue.length;
    }
    this._queue.splice(priority, 0, task);
    this._noticeChange();
  },
  'removeTask': function(task) {
    var i, val, _i, _len, _ref;
    i = 0;
    _ref = this._queue;
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      val = _ref[i];
      if (this._queue[i] === task) {
        deleteArrayKey(this._queue, i);
        this._noticeChange();
        break;
      }
    }
  },
  _exeQueue: function() {
    if (!this['paused']) {
      this['exe']();
    }
  },
  'exe': function() {
    var func, task,
      _this = this;
    task = this._queue.shift();
    if (task) {
      if (task['one'] && task['start']) {
        task['one']('nexttask', this['done']);
        func = proxy(task, task['start']);
      } else if (hasDeclaredArgument(task)) {
        func = proxy(this, task);
      } else {
        func = function(done) {
          task.call(_this);
          done();
        };
      }
      return func(this['done']);
    }
  }
});

AbstractTask['Parallel'] = AbstractTask['Async'] = classExtend(AbstractTask, {
  'exe': function() {
    if (this._queue) {
      if (!this._queue.length) {
        emit_complete(this);
        return emit_nexttask(this);
      }
      this._processcount = this._queue.length;
      while (!this['paused'] && this._queue && this._queue[0]) {
        this['_super']();
      }
    }
  },
  'done': function() {
    emit_progress(this);
    this._processcount--;
    if (!this._processcount) {
      emit_complete(this);
      emit_nexttask(this);
    }
  }
});

AbstractTask['Serial'] = AbstractTask['Sync'] = classExtend(AbstractTask, {
  'exe': function() {
    if (this._queue && !this['paused']) {
      if (this._queue[0]) {
        return this['_super']();
      }
      emit_complete(this);
      emit_nexttask(this);
    }
  },
  'done': function() {
    emit_progress(this);
    this['exe']();
  }
});

ns['Done'] = AbstractTask;
