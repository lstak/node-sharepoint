/// <reference path='../typings/node/node.d.ts' />

'use strict';

var fs = require('fs');
var qs = require('querystring');
var xml2js = require('xml2js');
var http = require('http');
var https = require('https');
var urlparse = require('url').parse;
var samlRequestTemplate = fs.readFileSync(__dirname + '/SAML.xml', 'utf8');

var buildSamlRequest = function(params) {
    var key,
        saml = samlRequestTemplate;

    for (key in params) {
        saml = saml.replace('[' + key + ']', params[key]);
    }

    return saml;
};

var parseXml = function(xml, callback) {
    var parser = new xml2js.Parser({
        emptyTag: ''  // use empty string as value when tag empty
    });

    parser.on('end', function(js) {
        callback && callback(js);
    });

    parser.parseString(xml);
};

var parseCookie = function(txt) {
    var properties = txt.split('; ');
    var cookie = { name: '', value: '' };

    properties.forEach(function(property, index) {
        var idx = property.indexOf('='),
            name = (idx > 0 ? property.substring(0, idx) : property),
            value = (idx > 0 ? property.substring(idx + 1) : undefined);

        if (index === 0) {
            cookie.name = name;
            cookie.value = value;
        } else {
            cookie[name] = value
        }

    })

    return cookie;
};

var parseCookies = function(txts) {
    var cookies = [];

    if (txts) {
        txts.forEach(function(txt) {
            var cookie = parseCookie(txt);
            cookies.push(cookie)
        })
    };

    return cookies;
}


var getCookie = function(cookies, name) {
    var cookie,
        i = 0,
        len = cookies.length;

    for (; i < len; i++) {
        cookie = cookies[i]
        if (cookie.name == name) {
            return cookie
        }
    }

    return undefined;

}

function requestToken(params, callback) {
    var samlRequest = buildSamlRequest({
        username: params.username,
        password: params.password,
        endpoint: params.endpoint
    });

    var options = {
        method: 'POST',
        host: params.sts.host,
        path: params.sts.path,
        headers: {
            'Content-Length': samlRequest.length
        }
    };


    var req = https.request(options, function(res) {
        var xml = '';

        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            xml += chunk;
        })

        res.on('end', function() {

            parseXml(xml, function(js) {

                // check for errors
                if (js['S:Envelope']['S:Body'][0] && js['S:Envelope']['S:Body'][0]['S:Fault']) {
                    var error = js['S:Envelope']['S:Body'][0]['S:Fault'][0]['S:Detail']['psf:error']['psf:internalerror']['psf:text'];
                    callback(error);
                    return;
                } 

                // extract token
                var token = js['S:Envelope']['S:Body']['wst:RequestSecurityTokenResponse']['wst:RequestedSecurityToken']['wsse:BinarySecurityToken']['#'];

                // Now we have the token, we need to submit it to SPO
                submitToken({
                    token: token,
                    endpoint: params.endpoint
                }, callback)
            })
        })
    });

    req.end(samlRequest);
}

function submitToken(params, callback) {
    var token = params.token,
        url = urlparse(params.endpoint),
        ssl = (url.protocol == 'https:');

    var options = {
        method: 'POST',
        host: url.hostname,
        path: url.path,
        headers: {
            // E accounts require a user agent string
            'User-Agent': 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Win64; x64; Trident/5.0)'
        }
    };

    var protocol = (ssl ? https : http);



    var req = protocol.request(options, function(res) {

        var xml = '';
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            xml += chunk;
        })

        res.on('end', function() {

            var cookies = parseCookies(res.headers['set-cookie'])

            callback(null, {
                FedAuth: getCookie(cookies, 'FedAuth').value,
                rtFa: getCookie(cookies, 'rtFa').value
            })
        })
    });

    req.end(token);
}


function signin(username, password, callback) {
    var self = this;

    var options = {
        username: username,
        password: password,
        sts: self.sts,
        endpoint: self.url.protocol + '//' + self.url.hostname + self.login
    }

    requestToken(options, function(err, data) {

        if (err) {
            callback(err);
            return;
        }

        self.FedAuth = data.FedAuth;
        self.rtFa = data.rtFa;

        callback(null, data);
    })
}



function request(options, next) {

    var req_data = options.data || '',
        list = options.list,
        id = options.id,
        query = options.query,
        ssl = (this.protocol == 'https:'),
        path = this.path + this.odatasvc + list +
            (id ? '(' + id + ')' : '') +
            (query ? '?' + qs.stringify(query) : '');

    var req_options = {
        method: options.method,
        host: this.host,
        path: path,
        headers: {
            'Accept': options.accept || 'application/json',
            'Content-type': 'application/json',
            'Cookie': 'FedAuth=' + this.FedAuth + '; rtFa=' + this.rtFa,
            'Content-length': req_data.length
        }
    };

    // Include If-Match header if etag is specified
    if (options.etag) {
        req_options.headers['If-Match'] = options.etag;
    };

    //console.log('OPTIONS:', req_options);
    //console.log('DATA:', req_data);

    // support for using https
    var protocol = (ssl ? https : http);

    var req = protocol.request(req_options, function(res) {
        //console.log('STATUS:', res.statusCode);
        //console.log('HEADERS:', res.headers);
       

        var res_data = '';
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            //console.log('CHUNK:', chunk);
            res_data += chunk;
        });
        res.on('end', function() {
            // if no callback is defined, we're done.
            if (!next) return;

            // if data of content-type application/json is return, parse into JS:
            if (res_data && (res.headers['content-type'].indexOf('json') > 0)) {
                res_data = JSON.parse(res_data).d
            }

            if (res_data) {
                next(null, res_data)
            }
            else {
                next()
            }
        });
    })

    req.end(req_data);
}


// the following call to get are allowed:
// get([callback]) - fecth all items from list
// get(id [,callback]) - fetch an item from the list
// get(query [,callback]) - query list

function get(arg1, arg2) {
    var id, query, callback;

    if ('object' == typeof arg1) {
        query = arg1,
        callback = arg2
    }

    if ('string' == typeof arg1 || 'number' == typeof arg1) {
        id = arg1,
        callback = arg2
    }

    if (!arg2) {
        callback = arg1
    }

    var options = {
        list: this.name,
        id: id,
        query: query,
        method: 'GET'
    };

    this.service.request(options, callback);
}

function add(attributes, next) {
    var options = {
        list: this.name,
        method: 'POST',
        data: JSON.stringify(attributes)
    };

    this.service.request(options, next);
}

function del(id, next) {
    var options = {
        list: this.name,
        id: id,
        method: 'DELETE'
    };

    this.service.request(options, next);
}


function update(id, attributes, next) {
    var options = {
        list: this.name,
        id: id,
        method: 'MERGE',
        etag: attributes.__metadata.etag,
        data: JSON.stringify(attributes)
    };

    this.service.request(options, next);
}



// convenience method to create a List provided by RestService.
function list(name) {
    var list = new SP.List(this, name)
    return list;
};

// method to fetch a RestService metadata document
function metadata(next) {
    var options = {
        list: '$metadata',
        accept: 'application/xml',
        method: 'GET'
    };

    this.request(options, next);
}


var SP = {
    List: null,
    RestService: null
};

// constructor for REST service
SP.RestService = function(url) {
    this.url = urlparse(url);
    this.host = this.url.host;
    this.path = this.url.path;
    this.protocol = this.url.protocol;


    // External Security Token Service for SPO
    this.sts = {
        host: 'login.microsoftonline.com',
        path: '/extSTS.srf'
    };

    // Form to submit SAML token
    this.login = '/_forms/default.aspx?wa=wsignin1.0';


    // SharePoint Odata (REST) service
    this.odatasvc = '/_vti_bin/ListData.svc/';

};

SP.RestService.prototype = {
    signin: signin,
    list: list,
    request: request,
    metadata: metadata
};


// Constructor for SP List
SP.List = function(service, name) {
    this.service = service
    this.name = name
}

SP.List.prototype = {
    get: get,
    add: add,
    update: update,
    del: del
};

module.exports = SP;