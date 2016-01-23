/**
 * This is the core module that provides powerful easy OOP concept, packaging and number of utility methods.
 * The module has no any dependency from others zebkit modules and can be used independently.
 * @module zebkit
 */
(function() {

//  Faster match operation analogues:
//  Math.floor(f)  =>  ~~(a)
//  Math.round(f)  =>  (f + 0.5) | 0
function isString(o)  {
    return typeof o !== "undefined" && o !== null &&
          (typeof o === "string" || o.constructor === String);
}

function isNumber(o)  {
    return typeof o !== "undefined" && o !== null &&
          (typeof o === "number" || o.constructor === Number);
}

function isBoolean(o) {
    return typeof o !== "undefined" && o !== null &&
          (typeof o === "boolean" || o.constructor === Boolean);
}

/**
 *  Create a new or return existent name space by the given name. The names space
 *  is structure to host various packages, classes, interfaces and so on. Usually
 *  developers should use "zebkit" name space to access standard zebkit classes,
 *  interfaces, methods and packages and also to put own packages, classes etc
 *  there. But in some cases it can be convenient to keep own stuff in a
 *  dedicated project specific name space.
 *  @param {String} nsname a name space name
 *  @return {Function} an existent or created name space. Name space is function
 *  that can be called to:
 *
 *    * Get the bound to the given name space variables:
 * @example
 *          // get all variables of "zebkit" namespace
 *          var variables = zebkit();
 *          variables["myVariable"] = "myValue" // set variables in "zebkit" name space
 *
 *    * Get list of packages that are hosted under the given name space:
 * @example
 *         // get all packages that "zebkit" name space contain
 *         zebkit(function(packageName, package) {
 *               ...
 *         });
 *
 *    * Create or access a package by the given package name (can be hierarchical):
 * @example
 *         var pkg = zebkit("test.io") // create or get "test.io" package
 *
 *  @method namespace
 *  @api zebkit.namespace()
 */
var $$$ = 0, namespaces = {}, namespace = function(nsname, dontCreate) {
    if (isString(nsname) === false) {
        throw new Error("Invalid name space name : '" + nsname + "'");
    }

    if (namespaces.hasOwnProperty(nsname)) {
        return namespaces[nsname];
    }

    if (dontCreate === true) {
        throw new Error("Name space '" + nsname + "' doesn't exist");
    }

    function Package(name) {
        this.$url = null;
        this.$name = name;
        if (typeof document !== "undefined") {
            var s  = document.getElementsByTagName('script'),
                ss = s[s.length - 1].getAttribute('src'),
                i  = ss == null ? -1 : ss.lastIndexOf("/");

            this.$url = (i > 0) ? new zebkit.URL(ss.substring(0, i + 1))
                                : new zebkit.URL(document.location.toString()).getParentURL() ;
        }
    }

    if (namespaces.hasOwnProperty(nsname)) {
        throw new Error("Name space '" + nsname + "' already exists");
    }

    var f = function(name) {
        if (arguments.length === 0) return f.$env;

        if (typeof name === 'function') {
            for(var k in f) {
                if (f[k] instanceof Package) name(k, f[k]);
            }
            return null;
        }

        var b = Array.isArray(name);
        if (isString(name) === false && b === false) {
            for(var k in name) {
                if (name.hasOwnProperty(k)) f.$env[k] = name[k];
            }
            return;
        }

        if (b) {
           for(var i = 0; i < name.length; i++) f(name[i]);
           return null;
        }

        if (f[name] instanceof Package) {
            return f[name];
        }

        var names = name.split('.'), target = f;
        for(var i = 0, k = names[0]; i < names.length; i++, k = k + '.' + names[i]) {
            var n = names[i], p = target[n];
            if (typeof p === "undefined") {
                p = new Package(name);
                target[n] = p;
                f[k] = p;
            }
            else {
                if ((p instanceof Package) === false) {
                    throw new Error("Requested package '" + name +  "' conflicts with variable '" + n + "'");
                }
            }

            target = p;
        }
        return target;
    };

    f.Import = function() {
        var ns   = "=" + nsname + ".",
            code = [],
            packages = arguments.length === 0 ? null
                                              : Array.prototype.slice.call(arguments, 0);
        f(function(n, p) {
            if (packages == null || packages.indexOf(n) >= 0) {
                for (var k in p) {
                    if (k[0] !== '$' && k[0] !== '_' && (p[k] instanceof Package) === false && p.hasOwnProperty(k)) {
                        code.push(k + ns + n + "." + k);
                    }
                }
                if (packages != null) packages.splice(packages.indexOf(n), 1);
            }
        });

        if (packages != null && packages.length !== 0) {
            throw new Error("Unknown package(s): " + packages.join(","));
        }

        return code.length > 0 ?  "var " + code.join(",") + ";" : null;
    };

    f.$env = {};
    namespaces[nsname] = f;
    return f;
};

var pkg = zebra = zebkit = namespace('zebkit'),
    CNAME = pkg.CNAME = '$', CDNAME = '',
    FN = pkg.$FN = (isString.name !== "isString") ? (function(f) {     // IE stuff
                                                        var mt = f.toString().match(/^function\s+([^\s(]+)/);
                                                        return (mt == null) ? CDNAME : mt[1];
                                                    })
                                                  : (function(f) { return f.name; });

pkg.isInBrowser = typeof navigator !== "undefined";
pkg.isIE        = pkg.isInBrowser && (Object.hasOwnProperty.call(window, "ActiveXObject") || !!window.ActiveXObject);
pkg.isFF        = pkg.isInBrowser && window.mozInnerScreenX != null;
pkg.isTouchable = pkg.isInBrowser && ( (pkg.isIE === false && (!!('ontouchstart' in window ) || !!('onmsgesturechange' in window))) ||
                                       (!!window.navigator['msPointerEnabled'] && !!window.navigator["msMaxTouchPoints"] > 0)); // IE10

pkg.isMacOS = pkg.isInBrowser && navigator.platform.toUpperCase().indexOf('MAC') !== -1;

pkg.namespaces = namespaces;
pkg.namespace  = namespace;
pkg.$global    = (typeof window !== "undefined" && window != null) ? window : this;
pkg.isString   = isString;
pkg.isNumber   = isNumber;
pkg.isBoolean  = isBoolean;
pkg.$caller    = null; // currently called method reference

pkg.$MapImplementation = function() {
    var Map = function() {
        this.keys   = [];
        this.values = [];
        this.size   = 0 ;
    };

    Map.prototype = {
        set : function(key, value) {
            var i = this.keys.indexOf(key);
            if (i < 0) {
                this.keys.push(key);
                this.values.push(value);
                this.size++;
            }
            else {
               this.values[i] = value;
            }
            return this;
         },

        delete: function(key) {
            var i = this.keys.indexOf(key);
            if (i < 0) {
               return false;
            }

            this.keys.splice(i, 1);
            this.values.splice(i, 1);
            this.size--;
            return true;
        },

        get : function(key) {
            var i = this.keys.indexOf(key);
            return i < 0 ? undefined : this.values[i];
        },

        clear : function() {
            this.keys = [];
            this.keys.length = 0;
            this.values = [];
            this.values.length = 0;
            this.size = 0;
        },

        has : function(key) {
            return this.keys.indexOf(key) >= 0;
        },

        forEach: function(callback, context) {
            var $this = context == null ? this : context;
            for(var i = 0 ; i < this.size; i++) {
                callback.call($this, this.values[i], this.keys[i], this);
            }
        }
    };

    return Map;
};

// Map is class
if (typeof pkg.$global.Map === "undefined") {
    pkg.$global.Map = pkg.$MapImplementation();
}

pkg.clone = function (obj, map) {
    // clone atomic type
    if (obj == null || zebkit.isString(obj) || zebkit.isBoolean(obj) || zebkit.isNumber(obj)) {
        return obj;
    }

    if (obj.$notClonable === true) {
        return obj;
    }

    map = map || new Map();
    var t = map.get(obj);
    if (typeof t !== "undefined") {
        return t;
    }

    // clone with provided custom "clone" method
    if (typeof obj.$clone !== "undefined") {
        return obj.$clone(map);
    }

    // clone array
    if (Array.isArray(obj)) {
        var nobj = [];

        map.set(obj, nobj);
        map[obj] = nobj;

        for(var i = 0; i < obj.length; i++) {
            nobj[i] = pkg.clone(obj[i], map);
        }
        return nobj;
    }

    // function cannot be cloned
    if (typeof obj === 'function' || obj.constructor !==  Object) {
        return obj;
    }

    var nobj = {};
    map.set(obj, nobj);

    // clone object fields
    for(var k in obj) {
        if (obj.hasOwnProperty(k) === true) {
            nobj[k] = pkg.clone(obj[k], map);
        }
    }

    return nobj;
};

/**
 * Instantiate a new class instance by the given class name with the specified constructor
 * arguments.
 * @param  {Function} clazz a class
 * @param  {Array} [args] an arguments list
 * @return {Object}  a new instance of the given class initialized with the specified arguments
 * @api  zebkit.util.newInstance()
 * @method newInstance
 */
pkg.newInstance = function(clazz, args) {
    if (args && args.length > 0) {
        function f() {}
        f.prototype = clazz.prototype;
        var o = new f();
        clazz.apply(o, args);
        return o;
    }
    return new clazz();
};

function $toString() {
    return this.$hash$;
}

// return function that is meta class
//  parentTemplate      - parent template function (can be null)
//  templateConstructor - template function
//  inheritanceList     - parent class and interfaces
function make_template(parentTemplate, templateConstructor, inheritanceList) {
    templateConstructor.$hash$ = "$zEk$" + ($$$++);
    templateConstructor.toString = $toString;

    if (parentTemplate != null) {
        templateConstructor.prototype.clazz = templateConstructor;
    }

    templateConstructor.clazz = parentTemplate;
    templateConstructor.prototype.toString = $toString;
    templateConstructor.prototype.constructor = templateConstructor;

    // setup parent entities
    if (inheritanceList != null && inheritanceList.length > 0) {
        templateConstructor.$parents = {};
        for(var i = 0; i < inheritanceList.length; i++) {
            var inherited = inheritanceList[i];
            if (inherited == null || typeof inherited !== "function" || typeof inherited.$hash$ === "undefined") {
                throw new ReferenceError("Invalid parent class or interface:" + inherited);
            }

            if (templateConstructor.$parents[inherited.$hash$] === true) {
                throw Error("Duplicate inherited class or interface: " + inherited);
            }

            templateConstructor.$parents[inherited.$hash$] = true;

            // if parent has own parents copy the parents references
            if (inherited.$parents != null) {
                for(var k in inherited.$parents) {
                    if (inherited.$parents.hasOwnProperty(k)) {
                        if (templateConstructor.$parents[k] === true) {
                            throw Error("Duplicate inherited class or interface: " + k);
                        }

                        templateConstructor.$parents[k] = true;
                    }
                }
            }
        }
    }
    return templateConstructor;
}

pkg.getPropertySetter = function(obj, name) {
    var pi = obj.constructor.$propertyInfo;
    if (pi != null) {
        if (typeof pi[name] === "undefined") {
            var m = obj[ "set" + name[0].toUpperCase() + name.substring(1) ];
            pi[name] = (typeof m  === "function") ? m : null;
        }
        return pi[name];
    }

    var m = obj[ "set" + name[0].toUpperCase() + name.substring(1) ];
    return (typeof m  === "function") ? m : null;
};

// target - is object whose properties have to populated
// p      - properties
pkg.properties = function(target, p) {
    for(var k in p) {
        // skip private properties( properties that start from "$")
        if (k[0] !== '$' && p.hasOwnProperty(k) && typeof p[k] !== 'function') {
            var v = p[k],
                m = zebkit.getPropertySetter(target, k);

            // value factory detected
            if (v != null && v.$new != null) v = v.$new();

            if (m == null) {
                target[k] = v;  // setter doesn't exist, setup it as a field
            }
            else {
                // property setter is detected, call setter to
                // set the property value
                if (Array.isArray(v)) m.apply(target, v);
                else                  m.call(target, v);
            }
        }
    }
    return target;
};

pkg.Singleton = function(clazz) {
    if (clazz.$isSingleton === true) {
        throw new Error("Class " + clazz + " is already singleton");
    }

    var clz = Class(clazz, [
        function() {
            // make sure this constructor is not
            // called from a successor class
            if (this.clazz === clz) {
                if (clz.$instance != null) {
                    return clz.$instance;
                }
                clz.$instance = this;
                clz.$instance.isSingleton = true;
            }

            if (clazz.prototype[CNAME] != null) {
                this.$super.apply(this, arguments);
            }
        }
    ]);

    clz.$isSingleton = true;
    return clz;
};

/**
 * Interface is a special class that is used to "pitch" a class with a some marker.
 * It is not supposed an interface directly rules which method the class has to implement.

        // declare "I" interface
        var I = zebkit.Interface();

        // declare "A" class that implements "I" interface
        var A = zebkit.Class(I, [ function m() {} ]);

        // instantiate "A" class
        var a = new A();
        zebkit.instanceOf(a, I);  // true
        zebkit.instanceOf(a, A);  // true


 * @return {Function} an interface
 * @method Interface
 * @api  zebkit.Interface()
 */
pkg.Interface = make_template(null, function() {
    var $Interface = make_template(pkg.Interface, function() {
        throw new Error("Interface cannot be instantiated")
    }, null);

    if (arguments.length > 1) {
        throw Error("Only one argument is expected");
    }

    $Interface.api = [];

    if (arguments.length > 0) {
        var methods = [];

        // TODO: temporary solution for abstract methods declaration
        if (arguments[0] != null && arguments[0].abstract != null && Array.isArray(arguments[0].abstract)) {
            methods = arguments[0].abstract;
            for(var i = 0; i < methods.length; i++) {
                var mn = FN(methods[i]);
                eval("var method = function " + mn + "() { throw new Error('Method " + mn + "() not implemented'); };");
                methods[i] = method;
            }

            if (Array.isArray(arguments[0].methods)) {
                methods.concat.apply(this, arguments[0].methods);
            }
        } else {
            if (Array.isArray(arguments[0]) == false) {
                throw new Error("Array of methods is expected");
            }
            methods = arguments[0];
        }

        if (methods.length > 0) {
            for(var i = 0; i < methods.length; i++) {
                var method = methods[i];
                if (typeof method !== "function") {
                    throw new Error("Method is expected");
                }

                if (method.clazz != null) {
                    throw new Error("Interface cannot be inherited");
                }

                $Interface.api[i] = method;
            }
        }
    }
    return $Interface;
});

// single method proxy
function ProxyMethod(name, f, clazz) {
    if (typeof f.methodBody !== "undefined") {
        throw new Error("Proxy method '" + name + "' cannot be wrapped");
    }

    var a = function() {
        var cm = pkg.$caller;
        pkg.$caller = a;
        // don't use finally section it slower than try-catch
        try {
            var r = a.methodBody.apply(this, arguments);
            pkg.$caller = cm;
            return r;
        }
        catch(e) {
            pkg.$caller = cm;
            console.log(name + "(" + arguments.length + ") " + (e.stack ? e.stack : e));
            throw e;
        }
    };

    a.methodBody = f;
    a.methodName = name;
    a.boundTo    = clazz;
    return a;
}

/**
 * Class declaration method. Easy OOP concept supports:
 *
 *
 *  __Single class inheritance.__ Any class can extend an another zebkit class

        // declare class "A" that with one method "a"
        var A = zebkit.Class([
            function a() { ... }
        ]);

        // declare class "B" that inherits class "A"
        var B = zebkit.Class(A, []);

        // instantiate class "B" and call method "a"
        var b = new B();
        b.a();

    __Class method overriding.__ Override a parent class method implementation

        // declare class "A" that with one method "a"
        var A = zebkit.Class([
            function a() { ... }
        ]);

        // declare class "B" that inherits class "A"
        // and overrides method a with an own implementation
        var B = zebkit.Class(A, [
            function a() { ... }
        ]);

    __Constructors.__ Constructor is a method with empty name

        // declare class "A" that with one constructor
        var A = zebkit.Class([
            function () { this.variable = 100; }
        ]);

        // instantiate "A"
        var a = new A();
        a.variable // variable is 100

    __Static methods and variables declaration.__ Static fields and methods can be defined
    by declaring special "$clazz" method whose context is set to declared class

        var A = zebkit.Class([
            // special method where static stuff has to be declared
            function $clazz() {
                // declare static field
                this.staticVar = 100;
                // declare static method
                this.staticMethod = function() {};
            }
        ]);

        // access static field an method
        A.staticVar      // 100
        A.staticMethod() // call static method

    __Access to super class context.__ You can call method declared in a parent class

        // declare "A" class with one class method "a(p1,p2)"
        var A = zebkit.Class([
            function a(p1, p2) { ... }
        ]);

        // declare "B" class that inherits "A" class and overrides "a(p1,p2)" method
        var B = zebkit.Class(A, [
            function a(p1, p2) {
                // call "a(p1,p2)" method implemented with "A" class
                this.$super(p1,p2);
            }
        ]);

 *
 *  One of the powerful feature of zebkit easy OOP concept is possibility to instantiate
 *  anonymous classes and interfaces. Anonymous class is an instance of an existing
 *  class that can override the original class methods with own implementations, implements
 *  own list of interfaces. In other words the class instance customizes class definition
 *  for the particular instance of the class;

            // declare "A" class
            var A = zebkit.Class([
                function a() { return 1; }
            ]);

            // instantiate anonymous class that add an own implementation of "a" method
            var a = new A([
                function a() { return 2; }
            ]);
            a.a() // return 2

 * @param {zebkit.Class} [inheritedClass] an optional parent class to be inherited
 * @param {zebkit.Interface} [inheritedInterfaces*] an optional list of interfaces for
 * the declared class to be extended
 * @param {Array} methods list of declared class methods. Can be empty array.
 * @return {Function} a class definition
 * @api zebkit.Class()
 * @method Class
 */

function copyProtoFields(targetClazz, parentClazz, cb) {
    for (var k in parentClazz.prototype) {
        if (parentClazz.prototype.hasOwnProperty(k) === true) {
            var f = parentClazz.prototype[k];
            targetClazz.prototype[k] = (f != null && f.methodBody != null) ? ProxyMethod(f.methodName, f.methodBody, f.boundTo)
                                                                           : f;
            if (cb != null) {
                cb(targetClazz, parentClazz, targetClazz.prototype[k], f);
            }
        }
    }
}

/**
 * Extend existent class with the given methods and interfaces
 * Be  careful to use the method, pay attention the following facts:

- only the given class and the classes that inherit the class __after the extend method calling__ get the updates

 *
 * For example:

    var A = zebkit.Class([ // declare class A that defines one "a" method
        function a() {
            console.log("A:a()");
        }
    ]);

    var a = new A();
    a.a();  // show "A:a()" message

    A.extend([
        function b() {
            console.log("EA:b()");
        },

        function a() {   // redefine "a" method
            console.log("EA:a()");
        }
    ]);

    // can call b() method we just added to the instance class
    a.b(); // show "EA:b()" message
    a.a(); // show "EA:a()" message

 * @param {Array} methods array of the methods the class have to be
 * extended with
 * @method mixing
 */
function mixing(clazz, methods, overwritable) {
    if (overwritable == null) {
        overwritable = false;
    }

    if (Array.isArray(methods) === false) {
        throw new Error("Methods array is expected (" + methods + ")");
    }

    var names = {};
    for(var i = 0; i < methods.length; i++) {
        var method     = methods[i],
            methodName = FN(method);

        // detect if the passed method is proxy method
        if (method.methodBody != null) {
            throw new Error("Proxy method '" + methodName + "' cannot be mixed in a class");
        }

        // map user defined constructor to internal constructor name
        if (methodName === CDNAME) {
            methodName = CNAME;
        }
        else {
            if (methodName[0] === "$") {
                // populate prototype fields if a special method has been defined
                if (methodName === "$prototype") {
                    method.call(clazz.prototype, clazz);
                    if (clazz.prototype[CDNAME]) {
                        clazz.prototype[CNAME] = clazz.prototype[CDNAME];
                        delete clazz.prototype[CDNAME];
                    }
                    continue;
                }

                // populate class level fields if a special method has been defined
                if (methodName === "$clazz") {
                    method.call(clazz);
                    continue;
                }
            }
        }

        if (names[methodName] === true) {
            throw new Error("Duplicate declaration of '" + methodName+ "(...)' method");
        }

        var existentMethod = clazz.prototype[methodName];
        if (typeof existentMethod !== 'undefined') {
            if (typeof existentMethod !== 'function') {
                throw new Error("'" + methodName + "(...)' method clash with a field");
            }

            // check if the method has been already declared for the given class
            if (overwritable === false && existentMethod.boundTo === clazz) {
                throw new Error("Duplicate class '" + methodName +"(...)' method overwriting is not allowed");
            }
        }

        // Create and set proxy method that is bound to the given class
        clazz.prototype[methodName] = ProxyMethod(methodName, method, clazz);

        // save method we have already added to check double declaration error
        names[methodName] = true;
    }
}

pkg.Class = make_template(null, function() {
    if (arguments.length === 0) {
        throw new Error("No class definition was found");
    }

    if (Array.isArray(arguments[arguments.length - 1]) === false) {
        throw new Error("Invalid class definition");
    }

    if (arguments.length > 1 && typeof arguments[0] !== "function")  {
        throw new ReferenceError("Invalid parent class '" + arguments[0] + "'");
    }

    var classMethods = arguments[arguments.length - 1],
        parentClass  = null,
        toInherit    = []; // using slice can be slower that trivial copying array
                           // Array.prototype.slice.call(arguments, 0, arguments.length-1);

    // detect parent class in inheritance list as the first argument that has "clazz" set to Class
    if (arguments.length > 0 && (arguments[0] == null || arguments[0].clazz === pkg.Class)) {
        parentClass = arguments[0];
    }

    // use instead of slice for performance reason
    for(var i = 0; i < arguments.length - 1; i++) {
        toInherit[i] = arguments[i];

        // let's make sure we inherit interface
        if (parentClass == null || i > 0) {
            if (toInherit[i] == null || toInherit[i].clazz !== pkg.Interface) {
                throw new ReferenceError("Invalid inherited interface :" + toInherit[i]);
            }
        }
    }

    var classTemplate = make_template(pkg.Class, function() {
        this.$hash$ = "$ZkIo" + ($$$++);

        if (arguments.length > 0) {
            var a = arguments[arguments.length - 1];

            // anonymous is customized class instance if last arguments is array of functions
            if (Array.isArray(a) === true && typeof a[0] === 'function') {
                a = a[0];

                // prepare arguments list to declare an anonymous class
                var args = [ classTemplate ],      // first of all the class has to inherit the original class
                    k    = arguments.length - 2;

                // collect interfaces the anonymous class has to implement
                for(; k >= 0 && arguments[k].clazz === pkg.Interface; k--) {
                    args.push(arguments[k]);
                }

                // add methods list
                args.push(arguments[arguments.length - 1]);

                var cl = pkg.Class.apply(null, args),  // declare new anonymous class
                    // create a function to instantiate an object that will be made the
                    // anonymous class instance. The intermediate object is required to
                    // call constructor properly since we have arguments as an array
                    f  = function() {};

                cl.$name = classTemplate.$name; // the same class name for anonymous
                f.prototype = cl.prototype; // the same prototypes

                var o = new f();

                // call constructor
                // use array copy instead of cloning with slice for performance reason
                // (Array.prototype.slice.call(arguments, 0, k + 1))
                args = [];
                for(var i = 0; i < k + 1; i++) args[i] = arguments[i];
                cl.apply(o, args);

                // set constructor field for consistency
                o.constructor = cl;
                return o;
            }
        }

        if (this[CNAME] != null) {
            return this[CNAME].apply(this, arguments);
        }
    }, toInherit);

    // prepare fields that caches the class properties
    classTemplate.$propertyInfo = {};


    // copy parents prototype methods and fields into
    // new class template
    classTemplate.$parent = parentClass;
    if (parentClass != null) {
        copyProtoFields(classTemplate, parentClass);
    }

    if (toInherit.length > 0) {
        for(var i = toInherit[0].clazz === pkg.Interface ? 0 : 1; i < toInherit.length; i++) {

            mixing(classTemplate, toInherit[i].api);
        }
    }

    // extend method cannot be overridden
    classTemplate.prototype.extend = function() {
        var c = this.clazz,
            l = arguments.length,
            f = arguments[l - 1];

        // replace the instance class with a new intermediate class
        // that inherits the replaced class. it is done to support
        // $super method calls.
        if (this.$extended !== true) {
            c = Class(c,[]);
            this.$extended = true;         // mark the instance as extended to avoid double extending.
            c.$name = this.clazz.$name;
            this.clazz = c;
        }

        if (Array.isArray(f)) {
            var init = null;
            for(var i = 0; i < f.length; i++) {
                var n = FN(f[i]);
                if (n === CDNAME) {
                    init = f[i];  // postpone calling initializer before all methods will be defined
                }
                else {
                    if (typeof this[n] !== 'undefined' && typeof this[n] !== 'function') {
                        throw new Error("Method '" + n + "' clash with a property");
                    }
                    this[n] = ProxyMethod(n, f[i], c);
                }
            }
            if (init != null) init.call(this);
            l--;
        }

        // add new interfaces if they has been passed
        for(var i = 0; i < l; i++) {
            if (arguments[i].clazz !== pkg.Interface) {
                throw new Error("Invalid argument: " + arguments[i]);
            }
            c.$parents[arguments[i]] = true;
        }
        return this;
    };

    classTemplate.prototype.$super = function() {
       if (pkg.$caller != null) {
            var name = pkg.$caller.methodName,
                $s   = pkg.$caller.boundTo.$parent,
                args = arguments;

            if (arguments.length > 0 && typeof arguments[0] === 'function') {
                name = arguments[0].methodName;
                args = [];
                for(var i = 1; i < arguments.length; i++) {
                    args[i-1] = arguments[i];
                }
            }

            while ($s != null) {
                var m = $s.prototype[name];
                if (m != null) {
                    return m.apply(this, args);
                }
                $s = $s.$parent;
            }

            var cln = this.clazz && this.clazz.$name ? this.clazz.$name + "." : "";
            throw new ReferenceError("Method '" + cln + (name === CNAME ? "constructor"
                                                                        : name) + "(" + args.length + ")" + "' not found");
        }
        throw new Error("$super is called outside of class context");
    };

    classTemplate.prototype.$clone = function(map) {
        map = map || new Map();

        var f = function() {};
        f.prototype = this.constructor.prototype;
        var nobj = new f();
        map.set(this, nobj);

        for(var k in this) {
            if (this.hasOwnProperty(k)) {
                // obj's layout is obj itself
                var t = map.get(this[k]);
                if (t !== undefined) {
                    nobj[k] = t;
                } else {
                    nobj[k] = zebra.clone(this[k], map);
                }
            }
        }

        // speed up clearing resources
        map.clear();

        nobj.constructor = this.constructor;
        nobj.$hash$ = "$zObj_" + ($$$++);
        nobj.clazz = this.clazz;
        return nobj;
    };

    classTemplate.prototype.clazz = classTemplate;

    // check if the method has been already defined in the class
    if (typeof classTemplate.prototype.properties === 'undefined') {
        classTemplate.prototype.properties = function(p) {
            return pkg.properties(this, p);
        };
    }

    var lans = "Listeners are not supported";

    // check if the method has been already defined in the class
    if (typeof classTemplate.prototype.bind === 'undefined') {
        classTemplate.prototype.bind = function() {
            if (this._ == null) {
                throw new Error(lans);
            }
            return this._.add.apply(this._, arguments);
        };
    }

    // check if the method has been already defined in the class
    if (typeof classTemplate.prototype.unbind === 'undefined') {
        classTemplate.prototype.unbind = function() {
            if (this._ == null) {
                throw new Error(lans);
            }
            this._.remove.apply(this._, arguments);
        };
    }

    mixing(classTemplate, classMethods, true);

    // populate static fields
    // TODO: exclude the basic static methods and static constant
    // static inheritance
    if (parentClass != null) {
        for (var k in parentClass) {
            if (k[0] !== '$' &&
                parentClass.hasOwnProperty(k) &&
                classTemplate.hasOwnProperty(k) === false)
            {
                classTemplate[k] = pkg.clone(parentClass[k]);
            }
        }
    }

     // add extend later to avoid the method be inherited as a class static field
    classTemplate.extend = function() {
        // inject class
        if (arguments[1] !== false && this.$isInjected !== true) {
            // create intermediate class
            var A = this.$parent != null ? Class(this.$parent, []) : Class([]);

            // copy this class prototypes methods to intermediate class A and re-define
            // boundTo to the intermediate class A if they were bound to this class
            copyProtoFields(A, this, function(targetClazz, srcClazz, addedMethod, sourceMethod) {
                if (addedMethod != sourceMethod && addedMethod.boundTo === srcClazz) {
                    addedMethod.boundTo = A;
                    if (sourceMethod.boundTo === srcClazz) sourceMethod.boundTo = A;
                }
            });

            this.$parent = A;
            this.$isInjected = true;
        }

        mixing.call(this, this, arguments[0], true);
    };

    return classTemplate;
});

var Class    = pkg.Class,
    $busy    = 1,
    $cachedO = pkg.$cachedO = {},
    $cachedE = pkg.$cachedE = [],
    $readyCallbacks = []; // stores method that wait for redness

pkg.$cacheSize = 7777;

/**
 * Get an object by the given key from cache (and cached it if necessary)
 * @param  {String} key a key to an object. The key is hierarchical reference starting with the global
 * name space as root. For instance "test.a" key will fetch $global.test.a object.
 * @return {Object}  an object
 * @api  zebkit.$cache
 */
pkg.$cache = function(key) {
    // don't cache global objects
    if (pkg.$global[key]) {
        return pkg.$global[key];
    }

    if ($cachedO.hasOwnProperty(key) === true) {
        // read cached entry
        var e = $cachedO[key];
        if (e.i < ($cachedE.length-1)) { // cached entry is not last one

            // move accessed entry to the list tail to increase its access weight
            var pn = $cachedE[e.i + 1];
            $cachedE[e.i]   = pn;
            $cachedE[++e.i] = key;
            $cachedO[pn].i--;
        }
        return e.o;
    }

    var ctx = pkg.$global, i = 0, j = 0;
    for( ;ctx != null; ) {
        i = key.indexOf('.', j);

        if (i < 0) {
            ctx = ctx[key.substring(j, key.length)];
            break;
        }

        ctx = ctx[key.substring(j, i)];
        j = i + 1;
    }

    if (ctx != null) {
        if ($cachedE.length >= pkg.$cacheSize) {
            // cache is full, replace first element with the new one
            var n = $cachedE[0];
            $cachedE[0]   = key;
            $cachedO[key] = { o:ctx, i:0 };
            delete $cachedO[n];
        }
        else {
            $cachedO[key] = { o: ctx, i:$cachedE.length };
            $cachedE[$cachedE.length] = key;
        }
        return ctx;
    }

    throw new Error("Reference '" + key + "' not found");
};

/**
 * Get class by the given class name
 * @param  {String} name a class name
 * @return {Function} a class. Throws exception if the class cannot be
 * resolved by the given class name
 * @method forName
 * @throws Error
 * @api  zebkit.forName()
 */
Class.forName = function(name) {
    return pkg.$cache(name);
};

Class.newInstance = function() {
    return pkg.newInstance(this, arguments);
};

/**
 * Test if the given object is instance of the specified class or interface. It is preferable
 * to use this method instead of JavaScript "instanceof" operator whenever you are dealing with
 * zebkit classes and interfaces.
 * @param  {Object} obj an object to be evaluated
 * @param  {Function} clazz a class or interface
 * @return {Boolean} true if a passed object is instance of the given class or interface
 * @method instanceOf
 * @api  zebkit.instanceOf()
 */
pkg.instanceOf = function(obj, clazz) {
    if (clazz != null) {
        if (obj == null || typeof obj.clazz === 'undefined') {
            return false;
        }

        var c = obj.clazz;
        return c != null && (c === clazz ||
               (typeof c.$parents !== 'undefined' && c.$parents.hasOwnProperty(clazz.$hash$)));
    }

    throw new Error("instanceOf(): null class");
};

/**
 * The method makes sure all variables, structures, elements are loaded
 * and ready to be used. The result of the method execution is calling
 * passed callback functions when the environment is ready. The goal of
 * the method to provide safe place to run your code safely in proper
 * place and at proper time.

        zebkit.ready(function() {
            // run code here safely
            ...
        });

 * @param {Fucntion|Array} [f] a function or array of functions to be called
 * safely. If there no one callback method has been passed it causes busy
 * flag will be decremented.
 * @method ready
 * @api  zebkit.ready()
 */
pkg.ready = function() {
    if (arguments.length === 0) {
        if ($busy > 0) $busy--;
    }
    else {
        if (arguments.length === 1 &&
            $busy === 0 &&
            $readyCallbacks.length === 0)
        {
            arguments[0]();
            return;
        }
    }

    for(var i = 0; i < arguments.length; i++) {
        $readyCallbacks.push(arguments[i]);
    }

    while ($busy === 0 && $readyCallbacks.length > 0) {
        $readyCallbacks.shift()();
    }
};

pkg.package = function(name, callback) {
    var p = zebkit(name);
    for(var i = 1; i < arguments.length; i++) {
        var f = arguments[i];
        // call in ready section since every call
        // can have influence on ready state
        zebkit.ready(function() {
            f.call(p, p, zebkit.Class);
            pkg.$resolveClassNames(p);
        });
    }
};

pkg.busy = function() { $busy++; };

/**
 * Dummy class that implements nothing but can be useful to instantiate
 * anonymous classes with some on "the fly" functionality:

        // instantiate and use zebkit class with method "a()" implemented
        var ac = new zebkit.Dummy([
             function a() {
                ...
             }
        ]);

        // use it
        ac.a();
 *
 * @class zebkit.Dummy
 */
pkg.Dummy = Class([]);


// TODO:
//!!! this code resolve names of classes  defined in a package
//    should be re-worked to use more generic and trust-able mechanism
pkg.$resolveClassNames = function(p) {
    function collect(prefix, p) {
        for(var k in p) {
            if (k[0]   !== "$"         &&
                p[k] != null         &&
                p[k].$name == null   &&
                p.hasOwnProperty(k)  &&
                p[k].clazz === Class   )
            {
                p[k].$name = prefix != null ? prefix + "." + k : k;
                collect(p[k].$name, p[k]);
            }
        }
    }

    if (arguments.length === 0) {
        pkg(function(name, p) {
            collect(null, p);
        });
    } else {
        collect(null, p);
    }
};

if (pkg.isInBrowser) {
    var m = window.location.search.match(/[?&][a-zA-Z0-9_.]+=[^?&=]+/g), env = {};
    for(var i=0; m && i < m.length; i++) {
        var l = m[i].split('=');
        env[l[0].substring(1)] = l[1];
    }
    pkg(env);

    //               protocol[1]        host[2]  path[3]  querystr[4]
    var purl = /^([a-zA-Z_0-9]+\:)\/\/([^\/]*)(\/[^?]*)(\?[^?\/]*)?/;

    /**
     * URL class
     * @param {String} url an url
     * @constructor
     * @class zebkit.URL
     */
    pkg.URL = function(url) {
        var a = document.createElement('a');
        a.href = url;
        var m = purl.exec(a.href);

        if (m == null) {
            m = purl.exec(window.location);
            if (m == null) {
                throw new Error("Cannot resolve '" + url + "' url");
            }
            a.href = m[1] + "//" + m[2] + m[3].substring(0, p.lastIndexOf("/") + 1) + url;
            m = purl.exec(a.href);
        }

        /**
         * URL path
         * @attribute path
         * @type {String}
         * @readOnly
         */
        this.path = m[3].replace(/[\/]+/g, "/");
        this.href = a.href;

        /**
         * URL protocol
         * @attribute protocol
         * @type {String}
         * @readOnly
         */
        this.protocol = (m[1] != null ? m[1].toLowerCase() : null);

        /**
         * Host
         * @attribute host
         * @type {String}
         * @readOnly
         */
        this.host = m[2];

        /**
         * Query string
         * @attribute qs
         * @type {String}
         * @readOnly
         */
        this.qs = m[4];
    };

    pkg.URL.prototype.toString = function() {
        return this.href;
    };

    /**
     * Get a parent URL of the URL
     * @return  {zebkit.URL} a parent URL
     * @method getParentURL
     */
    pkg.URL.prototype.getParentURL = function() {
        var i = this.path.lastIndexOf("/");
        return (i < 0) ? null
                       : new pkg.URL(this.protocol + "//" + this.host + this.path.substring(0, i + 1));
    };

    /**
     * Test if the given url is absolute
     * @param  {u}  u an URL
     * @return {Boolean} true if the URL is absolute
     * @method isAbsolute
     */
    pkg.URL.isAbsolute = function(u) {
        return /^[a-zA-Z]+\:\/\//i.test(u);
    };

    /**
     * Join the given relative path to the URL.
     * If the passed path starts from "/" character
     * it will be joined without taking in account
     * the URL path
     * @param  {String} p a relative path
     * @return {String} an absolute URL
     * @method join
     */
    pkg.URL.prototype.join = function(p) {
        if (pkg.URL.isAbsolute(p)) {
            throw new Error("Absolute URL '" + p + "' cannot be joined");
        }

        return p[0] === '/' ? this.protocol + "//" + this.host + p
                            : this.protocol + "//" + this.host + this.path + (this.path[this.path.length-1] === '/' ? '' : '/') + p;
    };

    var $interval = setInterval(function () {
        if (document.readyState === "complete") {
            clearInterval($interval);
            pkg.ready();
        }
    }, 100);
} else {
    pkg.ready();
}

pkg.ready(function() {
    console.log(" ::: " + new Date().getTime());
    pkg.$resolveClassNames();
    console.log(" ::: " + new Date().getTime());
});


/**
 * @for
 */
})();
