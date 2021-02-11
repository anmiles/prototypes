var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;
var http = require('http');
var https = require('https');
var extend = require('extend');
var iconv = require('iconv-lite');

String.prototype.format = function() {
    if (arguments.length === 0) return this;
    
    var data;
    if (arguments.length > 1) data = arguments;
    else if (typeof arguments[0] === 'object') data = arguments[0];
    else data = arguments;
    
    return this.split('{{').map(function(q) {
        return q.replace(/\{([^\{\}]+)\}/g, function($0, $1) {
            return data[$1] === undefined || data[$1] === null ? '' : data[$1];
        });
    }).join('{').replace(/\}\}/g, '}');
};

String.prototype.toUpperFirstLetter = function() {
    if (this.length === 0) return this;
    return this[0].toUpperCase() + this.substring(1, this.length);
};

String.prototype.toLowerFirstLetter = function() {
    if (this.length === 0) return this;
    return this[0].toLowerCase() + this.substring(1, this.length);
};

String.prototype.repeat = function(count)
{
    var output = [];
    
    for (var i = 0; i < count; i ++)
    {
        output.push(this);
    }
    
    return output.join('');
};

String.prototype.regexEscape = function()
{
    return this.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

String.prototype.htmlEscape = function()
{
    return this.replace(/[\u00A0-\u9999<>\&]/gim, function(i) {return '&#' + i.charCodeAt(0) + ';'});
};

String.prototype.urlEscape = function()
{
    return this.replace(/([^A-Za-z0-9]+)/gim, '-').toLowerCase();
};

String.prototype.pad = function(length, symbol, isPadLeft)
{
    if (typeof length !== 'number') length = length.length;
    if (typeof symbol === 'undefined') symbol = ' ';
    else if (typeof symbol !== 'string') symbol = symbol.toString();
    var diff = length - this.length;
    if (diff < 0) return this;
    
    var space = '';
    
    for (var i = 0; i < diff; i += symbol.length)
    {
        space += symbol;
    }
    
    return isPadLeft ? space + this : this + space;
};

String.prototype.download = function(callback)
{
    const url = this.toString();
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, function(res)
    {
        var body = '';

        res.on('data', function(chunk)
        {
            body += chunk;
        });

        res.on('end', function()
        {
            callback(body, res);
        });
    });
};

String.prototype.downloadJSON = function(callback)
{
    this.download((body, res) => {
        var result = JSON.parse(body);
        callback(result, res);
    });
};

Number.prototype.case = function(zero, one, two) {
    var words = typeof arguments[0] === 'object' ? arguments[0] : arguments;
    var cases = [0, 1, 2, 2, 2, 0, 0, 0, 0, 0];
    var index = ((this - (this % 10)) / 10) % 10 === 1 ? 0 : cases[this % 10];
    return words[index];
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

if (typeof Array.prototype.unique === 'undefined') {
    Array.prototype.unique = function() {
        return this.filter(function (value, index, self) {
            return self.indexOf(value) === index;
        });
    };
}

Array.prototype.equals = function(array) {
    if (this.length !== array.length) return false;
    
    for (var i = 0; i < this.length; ++i) {
        if (this[i] !== array[i]) return false;
    }
    return true;
}

Array.prototype.indexFieldOf = function(fields, searchTerm, skip) {
    if (typeof skip !== 'number') skip = 0;
    if (typeof fields === 'string') fields = [fields];
    
    for (var i = Math.max(0, skip); i < this.length; i ++) {
        var val = this[i];
        
        for (var j = 0; j < fields.length; j ++) {
            val = val[fields[j]];
            if (typeof val === 'undefined') break;
        }
        
        if (val === searchTerm) return i;
    }
    
    return -1;
};

Array.prototype.sum = function(){
    return this.reduce(function(a, b) {return a + b}, 0);
};

(function(sort) {
    Array.prototype.sort = function() {
        var fields = Array.prototype.slice.call(arguments);
        if (typeof fields[0] === 'function') return sort.apply(this, fields);
        if (typeof fields[0] === 'boolean') fields = [{'': fields[0]}];
        if (Array.isArray(fields[0])) fields = fields[0];

        return this.sort(function(item1, item2) {
            for (var i = 0; i < fields.length; i ++) {
                var field = fields[i];
                var asc = true;
                var options = {};
                var val1 = item1;
                var val2 = item2;
                
                if (typeof field === 'object') {
                    options = field;
                    asc = Object.values(field)[0];
                    field = Object.keys(field)[0];
                }
                
                if (typeof field !== 'object') {
                    field = [field];
                }
                
                for (var j = 0; j < field.length; j ++) if (field[j] !== '') {
                    val1 = val1[field[j]];
                    val2 = val2[field[j]];
                }
                
                if (options.ignoreCase) {
                    val1 = (val1 || '').toString().toLowerCase();
                    val2 = (val2 || '').toString().toLowerCase();
                }
                
                if (options.find) {
                    val1 = (val1 || '').toString().replace(options.find, options.replace);
                    val2 = (val2 || '').toString().replace(options.find, options.replace);
                }
                
                if (val2 < val1) return asc ? 1 : -1;
                if (val2 > val1) return asc ? -1 : 1;
            }
            
            if (fields.length === 0) {
                if (item2 < item1) return 1;
                if (item2 > item1) return -1;
            }
            
            return 0;
        });
    };
})(Array.prototype.sort);

fs.readJSON = function(filename)
{
    return eval('(' + fs.readFileSync(filename) + ')');
};

fs.writeJSON = function(filename, val)
{
    fs.writeFileSync(filename, '\ufeff' + JSON.stringify(val, null, '    '));
};

fs.readTSV = function(filename)
{
    const tsv = iconv.decode(fs.readFileSync(filename), 'cp1251');
    const lines = tsv.trim().split('\r\n').map(line => line.split('\t'));

    if (lines.length > 0) {
        const header = lines.shift();
        const arr = lines.map(line => line.reduce((obj, value, key) => {obj[header[key]] = value; return obj}, {}));
        return arr;
    }

    return [];
};

fs.writeTSV = function(filename, arr)
{
    let tsv = '';

    if (arr.length > 0) {
        const header = Object.keys(arr[0]);
        const lines = arr.map(item => header.map(field => item[field]));
        lines.unshift(header);
        tsv = lines.map(line => line.join('\t')).join('\r\n');
    }

    fs.writeFileSync(filename, iconv.encode(tsv, 'cp1251'));
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

fs.recurse = function(root, callback_file, callback_dir_before, callback_dir_after) {
    if (!fs.existsSync(root)) {
        return;
    }
    
    fs.readdirSync(root).forEach(function(filename, index) {
        var filepath = path.join(root, filename);
        
        if (fs.lstatSync(filepath).isDirectory()) {
            if (callback_dir_before) callback_dir_before(filepath, filename);
            fs.recurse(filepath, callback_file, callback_dir_before, callback_dir_after);
            if (callback_dir_after) callback_dir_after(filepath, filename);
        } else {
            if (callback_file) callback_file(filepath, filename);
        }
    });
};

fs.deleteFolderRecursive = function(root, deleteRoot) {
    var ignores = ['.gitignore'];
    
    fs.recurse(root, (filepath, filename) => {
        if (ignores.indexOf(filename) === -1) fs.unlinkSync(filepath);
    }, null, (filepath, filename) => {
        fs.rmdirSync(filepath);
    });
    
    if (deleteRoot) {
        fs.rmdirSync(root);
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