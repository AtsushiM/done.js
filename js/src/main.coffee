ns = do () ->
    if typeof module == 'undefined'
        return window
    return module['exports']

TRUE = true
FALSE = false
NULL = null
NULLOBJ = {}
class_initializing = FALSE
class_fnTest = if /0/.test(-> 0; return;) then /\b_super\b/ else /.*/
Class = ->

_is = (key, vars) ->
    if Object.prototype.toString.call(vars) == '[object ' + key + ']' then TRUE else FALSE

isNumber = (vars) ->
    _is 'Number', vars

isString = (vars) ->
    _is 'String', vars

isArray = (vars) ->
    _is 'Array', vars

isFunction = (vars) ->
    _is 'Function', vars

isDefined = (vars) ->
    if vars == undefined then FALSE else TRUE

proxy = (target, func) ->
    return ->
        return func.apply target, arguments

toArray = (obj) ->
    ary = [];

    ary.push.apply ary, obj

    return ary

copyArray = (ary) ->
    if isArray ary then ary.slice(0) else ary

deleteArrayKey = (array, key) ->
    array.splice key, 1
    return

bindOnProp = (that, config) ->
    for i, val of config
        if temp = i.match /^on(.+)$/
            that['on'] temp[1], val

    return

hasDeclaredArgument = (func) ->
    return !!(isFunction(func) && func.length);

emit_complete = (that) ->
    that['emit'] 'complete'

    return

emit_nexttask = (that) ->
    that['emit'] 'nexttask'

    return

emit_start = (that) ->
    that['emit'] 'start'

    return

emit_progress = (that) ->
    that['emit'] 'progress'

    return

Class['extend'] = (props) ->
    SuperClass = @

    Class = ->
        if !class_initializing && @['init']
            @['init'].apply @, arguments

        return

    addMethod = (key) ->
        prop = props[key]
        _super = SuperClass.prototype[key]
        isMethodOverride = (
            isFunction(prop) &&
            isFunction(_super) &&
            class_fnTest.test(prop)
        )

        if isMethodOverride
            Class.prototype[key] = ->
                temp = @['_super']

                @['_super'] = _super

                ret = prop.apply @, arguments

                @['_super'] = temp

                return ret
        else
            Class.prototype[key] = prop

            return

    class_initializing = TRUE
    Class.prototype = new SuperClass
    class_initializing = FALSE

    Class.prototype['constructor'] = Class

    for own i of props
        addMethod i

    Class['extend'] = SuperClass['extend']

    return Class

classExtend = (cls, prop, support) ->
    cls = cls || Class

    klass = cls['extend'](prop)

    if isDefined support
        klass['support'] = support

    return klass

classExtendObserver = (prop, support) ->
    return classExtend Observer, prop, support

Observer_removeChildExe = (childs, i) ->
    delete childs[i]._parentObserver
    deleteArrayKey childs, i

    return

Observer_bubble = ->
    args = toArray arguments || []
    callback = args[2]

    args = args.slice(0, 2)

    temp = @['only'].apply @, args

    if FALSE != temp && !(temp || {})._flgStopPropagation
        temp = @_parentObserver

        if temp then temp['bubble'].apply temp, args

    Observer_exeCallback callback

    return

Observer_exeCallback = (callback) ->
    if isFunction callback
        callback.apply @
    
    return

Observer_preventDefault = ->
    @._flgPreventDefault = TRUE
    return 

Observer_stopPropagation = ->
    @._flgStopPropagation = TRUE
    return

Observer_event = (that, args) ->
    e = args[0]

    if isString e
        e =
            'type': e
            'arguments': args
            _flgPreventDefault: FALSE
            _flgStopPropagation: FALSE
            'preventDefault': Observer_preventDefault
            'stopPropagation': Observer_stopPropagation

    e['before'] = e['target']
    e['target'] = that

    return e

Observer = Class['extend']
    'init': ->
        @_observed = {}
        @_childs = []

    'dispose': ->
        @['removeChild']

        for i of @
            temp = @[i]

            if temp && temp['dispose']
                temp['dispose']


        @['__proto__'] = null

        for i of @
            @[i] = null
            delete @[i]

        return

    'on': (key, func) ->
        observed = @_observed

        if (!observed[key])
            observed[key] = []

        observed[key].push func

        return

    'one': (key, func) ->
        wrap = =>
            func.apply @, arguments
            @['off'] key, wrap
            return

        wrap.original = func

        @['on'] key, wrap
        return

    'off': (key, func) ->
        observed = @_observed

        if func
            target = observed[key]

            if target
                for val, i in target by -1
                    if func == val || func == val.original
                        deleteArrayKey target, i

                        if target.length == 0
                            delete observed[key]

                        return TRUE

            return FALSE

        return delete observed[key]

    'emit': Observer_bubble
    'bubble': Observer_bubble
    'capture': ->
        args = toArray arguments
        callback = args[2]
        childs = @_childs

        args = args.slice 0, 2

        if FALSE !=  @['only'].apply @, args
            for val in childs by -1
                val['capture'].apply val, args

        Observer_exeCallback callback

        return
    'only': ->
        args = toArray arguments
        e = Observer_event @, args
        target = @_observed[e['type']] || []

        args[0] = e

        for val in target by -1
            if val
                val = val.apply @, args

                if val == FALSE || e._flgPreventDefault
                    return val

        Observer_exeCallback args[2]

        return e

    'addChild': (instance) ->
        if instance._parentObserver
            instance._parentObserver['removeChild'] instance

        instance._parentObserver = @
        @_childs.push instance

        return
    'removeChild': (instance) ->
        childs = @_childs

        if instance
            for val, i in childs by -1
                if childs[i] == instance
                    Observer_removeChildExe childs, i

                    return

        else
            for val, i in childs by -1
                Observer_removeChildExe childs, i

            return

AbstractTask = classExtendObserver
    'init': (config) ->
        @['_super']()

        config = config || NULLOBJ

        queue = copyArray(config['queue'] || [])

        bindOnProp @, config

        @['resetQueue'] queue
        @['done'] = proxy @, @['done']

        return

    'start': ->
        emit_start @
        @['paused'] = FALSE
        @_exeQueue()

        return

    'restart': (queue) ->
        @['resetQueue'] queue
        @['start']()

        return

    'stop': ->
        @_queue = NULL
        @['emit'] 'stop'

        return

    'pause': ->
        @['paused'] = TRUE
        @['emit'] 'pause'

        return

    'resume': ->
        if @['paused']
            @['emit'] 'resume'
            @['paused'] = FALSE
            @_exeQueue()

        return
    'resetQueue': (queue) ->
        if queue
            @_orgqueue = copyArray queue

        _queue = @_queue = copyArray @_orgqueue;

        for i of _queue
            if _queue[i]['resetQueue']
                _queue[i]['resetQueue']();

        @['emit'] 'reset';

        return

    _noticeChange: ->
        @['emit'] 'change', @['getQueue']()

        return
    'setQueue': (queue) ->
        @_queue = copyArray queue
        @_noticeChange()

        return

    'getQueue': ->
        return copyArray @_queue

    'addTask': (task, priority) ->
        if !isNumber(priority) || priority > @_queue.length
            priority = @_queue.length

        @_queue.splice(priority, 0, task)

        @_noticeChange()

        return

    'removeTask': (task) ->
        i = 0

        for val, i in @_queue
            if @._queue[i] == task
                deleteArrayKey @._queue, i
                @_noticeChange()

                break

        return

    _exeQueue: ->
        if !@['paused']
            @['exe']()

        return

    'exe': ->
        task = @_queue.shift()

        if task
            if task['one'] && task['start']
                task['one'] 'nexttask', @['done']
                func = proxy task, task['start']
            else if hasDeclaredArgument task
                func = proxy @, task
            else
                func = (done) =>
                    task.call @
                    done()

                    return

            return func @['done']

        return

AbstractTask['Parallel'] = AbstractTask['Async'] = classExtend AbstractTask, {
    'exe': ->
        if @_queue
            if !@_queue.length
                emit_complete @

                return emit_nexttask @

            @_processcount = @_queue.length

            while !@['paused'] && @_queue && @_queue[0]
                @['_super']()

        return

    'done': ->
        emit_progress @
        @_processcount--

        if !@_processcount
            emit_complete @
            emit_nexttask @

        return
}

AbstractTask['Serial'] = AbstractTask['Sync'] = classExtend AbstractTask, {
    'exe': ->
        if @_queue && !@['paused']
            if @_queue[0]
                return @['_super']()

            emit_complete @
            emit_nexttask @

        return

    'done': ->
        emit_progress @
        @['exe']()

        return
}

ns['Done'] = AbstractTask
