var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;
var http = require('http');
var extend = require('extend');

String.prototype.format = function()
{
    if (arguments.length === 0) return this;

    var data;
    if (arguments.length > 1) data = arguments;
    else if (typeof arguments[0] == 'object') data = arguments[0];
    else data = arguments;

    return this.split('{{').map(function(q)
    {
        return q.replace(/\{([^\{\}]+)\}/g, function ($0, $1)
            {
                return data[$1];
            });
    }).join('{').replace(/\}\}/g, '}');
};

String.prototype.repeat = function(count)
{
    var output = [];
    
    for (var i = 0; i < count; i ++)
    {
        output.push(this);
    }
    
    return output.join('');
}

String.prototype.regexEscape = function()
{
    return this.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

String.prototype.htmlEscape = function()
{
    return this.replace(/[\u00A0-\u9999<>\&]/gim, function(i) {return '&#'+i.charCodeAt(0)+';'});
};

String.prototype.capitalize = function()
{
    return this[0].toUpperCase() + this.substring(1);
};

String.prototype.downloadJSON = function(callback)
{
    http.get(this.toString(), function(res)
    {
        var body = '';

        res.on('data', function(chunk)
        {
            body += chunk;
        });

        res.on('end', function()
        {
            var result = JSON.parse(body);
            callback(result);
        });
    });
};

String.prototype.pad = function(length, symbol, isPadLeft)
{
    if (typeof length != 'number') length = length.length;
    if (typeof symbol != 'string' || symbol.length === 0) symbol = ' ';
    var diff = length - this.length;
    if (diff < 0) return this;
    
    var space = '';
    
    for (var i = 0; i < diff; i ++)
    {
        space += symbol;
    }
    
    return isPadLeft ? space + this : this + space;
};

Number.prototype.pad = function(beforePoint, afterPoint)
{
    var arr = this.toString().split('.');
    var leftPart = arr[0] ? arr[0] : '';
    var rightPart = arr[1] ? arr[1] : '';
    
    var leftDiff = beforePoint - leftPart.length;
    var rightDiff = afterPoint - rightPart.length;
    
    for (var i = 0; i < leftDiff; i ++)
    {
        leftPart = '0' + leftPart;
    }
    
    for (var i = 0; i < rightDiff; i ++)
    {
        rightPart = rightPart + '0';
    }
    
    if (rightPart.length > 0)
    {
        rightPart = "." + rightPart;
    }
    
    return leftPart + rightPart;
};

Array.prototype.indexFieldOf = function(fields, searchElement, fromIndex)
{
    if (typeof fromIndex != 'number') fromIndex = 0;
    if (typeof fields == 'undefined' || fields === null) fields = [];
    if (typeof fields == 'string') fields = [fields];
    
    for (var i = Math.max(0, fromIndex); i < this.length; i ++)
    {
        var val = this[i];
        for (var j = 0; j < fields.length; j ++)
        {
            val = val[fields[j]];
        }
        
        if (val === searchElement) return i;
    }
    
    return -1;
};

Array.prototype.sortAlphabetically = function(fields)
{
    if (typeof fields == 'undefined') fields = [];
    if (typeof fields == 'string') fields = [fields];
    
    return this.sort(function(a, b)
    {
        for (var i = 0; i < fields.length; i ++)
        {
            a = a[fields[i]];
            b = b[fields[i]];
        }
        
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
    });
};

Array.prototype.unique = function(){
    return this.filter((v, i, a) => a.indexOf(v) === i);
}

fs.readJSON = function(filename)
{
    return eval('(' + fs.readFileSync(filename) + ')');
};

fs.writeJSON = function(filename, val, depth)
{
    fs.writeFileSync(filename, '\ufeff' + JSON.beautify(val, null, depth));
};

fs.getCallerFile = function()
{
    var oldPrepareStackTrace = Error.prepareStackTrace;
    Error.prepareStackTrace = function (thisErr, stack) { return stack; };
        
    try
    {
        var err = new Error();
        var callerfile;
        var currentfile;

        currentfile = err.stack.shift().getFileName();
        var previous = false;

        while (err.stack.length)
        {
            callerfile = err.stack.shift().getFileName();

            if (currentfile !== callerfile)
            {
                if (!previous)
                {
                    previous = true;
                    currentfile = callerfile;
                }
                
                else
                {
                    Error.prepareStackTrace = oldPrepareStackTrace;
                    return callerfile;
                }
            }
        }
    }
    catch (err) {}
    
    Error.prepareStackTrace = oldPrepareStackTrace;
    return undefined;
};

fs.getFileName = function(fullName)
{
    fullName = fullName.replace(/(\/|\\)/g, path.sep);
    var sep = path.sep.regexEscape();
    return fullName.replace(new RegExp('(^.*{0})?'.format(sep)), '');
};

fs.getDirectoryName = function(fullName)
{
    fullName = fullName.replace(/(\/|\\)/g, path.sep);
    if (fullName.indexOf(path.sep) === -1) throw '"{0}" is not a valid path to get a directory name'.format(fullName);
    var sep = path.sep.regexEscape();
    return fullName.replace(new RegExp('[^{0}]+{0}?$'.format(sep)), '');
};

fs.ensureDirectory = function(directoryName)
{
    directoryName = directoryName.replace(/(\/|\\)/g, path.sep);
    if (directoryName.indexOf(path.sep) === -1) throw '"{0}" is not a valid path to ensure an existing'.format(directoryName);
    if (fs.existsSync(directoryName)) return directoryName;
    fs.ensureDirectory(fs.getDirectoryName(directoryName)) && fs.mkdirSync(directoryName);
    return directoryName;
};

fs.deleteFolderRecursive = function(path, keepRootDirectory) {
    const ignores = ['.gitignore'];

    if (!fs.existsSync(path)) {
        return;
    }
    
    fs.readdirSync(path).forEach(function(file, index) {
        var curPath = path + "/" + file;
        
        if (fs.lstatSync(curPath).isDirectory()) {
            fs.deleteFolderRecursive(curPath);
        } else {
            if (ignores.indexOf(file) === -1) fs.unlinkSync(curPath);
        }
    });
    
    if (keepRootDirectory) {
        fs.rmdirSync(path);
    }
};

fs.findLastFile = function(dir, searchRegex)
{
    dir = dir.replace(/(\/|\\)/g, path.sep);
    
    var lastDirectory = '';
    var lastFile = '';
    var files = fs.readdirSync(dir);
    
    for (var i = 0; i < files.length; i ++)
    {
        var fileStat = fs.lstatSync(dir + path.sep + files[i]);
        
        if (fileStat.isDirectory() && files[i] > lastDirectory)
        {
            lastDirectory = files[i];
        }
        else if (fileStat.isFile() && searchRegex.exec(files[i]) && files[i] > lastFile)
        {
            lastFile = files[i];
        }
    }
    
    if (lastFile !== '')
    {
        return dir + path.sep + lastFile;
    }
    else if (lastDirectory !== '')
    {
        return fs.findLastFile(dir + path.sep + lastDirectory, searchRegex);
    }
    else
    {
        return null;
    }
};

process.start = function(executable, args, options, output) {
    var defaultOptions = {
        cwd: executable.indexOf(path.sep) !== -1 
            ? fs.getDirectoryName(executable) 
            : path.resolve("./")
    };
    
    options = extend(defaultOptions, options || {});

    var defaultOutput = {
        stdout: true,
        stderr: true,
        debug: false
    };

    output = extend(defaultOutput, output || {});

    if (!args) args = [];
    
    if (!executable.match(/\.exe$/))
    {
        args = ['Start-Process', '-WorkingDirectory', options.cwd, executable, args.map(arg => `"${arg}"`).join(',')];
        executable = 'powershell';
    }
    
    if (output.debug)
    {
        console.log('command: {0}'.format(executable));
        console.log(args);
        console.log(options);
        console.log(output);
    }

    return new Promise(resolve => {
        var spawned = spawn(executable, args, options);
        
        if (output.stdout) spawned.stdout.on('data', data => {
            console.log(data.toString());
            if (typeof output.stdout === "function") output.stdout(data.toString());
        });
        
        if (output.stderr) spawned.stderr.on('data', data => {
            console.log(data.toString());
            if (typeof output.stderr === "function") output.stderr(data.toString());
        });

        spawned.on('exit', code => {
            if (code || output.debug) console.log('{0} exited with code {1}'.format(executable, code));
            resolve();
        });
    });
};

if (typeof global.construct != 'undefined') throw 'global.construct is already defined!';

global.construct = function(type)
{
    return function()
    {
        var Temp = function(){};
        Temp.prototype = type.prototype;
        return type.apply(new Temp, arguments);
    }
};