import promisify from 'sb-promisify'

var parse_status = function(str){
    var lines;
    var branch_line;
    var branches;
    var status = {
        local_branch: null,
        remote_branch: null,
        remote_diff: null,
        clean: true,
        files: []
    };
    var result;
    var initial_commit_rx =/^\#\# Initial commit on ([^\n]+)\s?$/;

    lines = str.trim().split('\n');
    branch_line = lines.shift();

    result = branch_line.match(initial_commit_rx);
    if (result){
        status.local_branch = result[1];
        return status;
    }

    branch_line = branch_line.replace(/\#\#\s+/, '');

    branches = branch_line.split('...');
    status.local_branch = branches[0];
    status.remote_diff = null;
    if (branches[1]){
        result = branches[1].match(/^([^\s]+)/);
        status.remote_branch = result[1];
        result = branches[1].match(/\[([^\]]+)\]/);
        status.remote_diff = result ? result[1] : null;
    }
    lines.forEach(function(str){
        if (str.match(/\S/)){
            status.files.push(str);
        }
    });
    status.clean = status.files.length === 0;
    return status;
};

var parse_show_ref = function(str){
    var refs = {};
    var lines = str.length === 0 ? [] : str.split('\n');
    lines.forEach(function(str){
        str = str.trim();
        if (str.length === 0) return;
        var parts = str.split(/\s+/);
        refs[parts[1]] = parts[0];

    });
    return refs;
};

module.exports = promisify(function(options, callback){
    var exec = require('child_process').exec;
    var cmd = 'git status --porcelain -b';
    exec(cmd, options, function(err, stdout){
        if (err) return callback(err);
        callback(null, parse_status(stdout));
    });
});

module.exports.parse_status = parse_status;
module.exports.parse_show_ref = parse_show_ref;