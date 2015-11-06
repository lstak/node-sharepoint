/// <reference path='../typings/node/node.d.ts' />
'use strict';
var fs = require('fs');
var qs = require('querystring');
var xml2js = require('xml2js');
var http = require('http');
var https = require('https');
var urlparse = require('url').parse;
var samlRequestTemplate = fs.readFileSync(__dirname + '/SAML.xml', 'utf8');
var SP;
(function (SP) {
    var MetadataOptions = (function () {
        function MetadataOptions(list, accept, method) {
            this.List = list;
            this.Accept = accept;
            this.Method = method;
        }
        return MetadataOptions;
    })();
    var Cookie = (function () {
        function Cookie(name, value) {
            this.Name = name;
            this.Value = value;
        }
        return Cookie;
    })();
    var RestService = (function () {
        function RestService(url) {
            this.Url = urlparse(url);
            this.Host = this.Url.host;
            this.Path = this.Url.path;
            this.Protocol = this.Url.protocol;
            this.STS = {
                Host: 'login.microsoftonline.com',
                Path: '/extSTS.srf'
            };
            this.Login = '/_forms/default.aspx?wa=wsignin1.0';
            this.ODataEndPoint = '/_vti_bin/ListData.svc/';
        }
        RestService.prototype.SignIn = function (username, password, callback) {
            var self = this;
            var options = {
                username: username,
                password: password,
                sts: self.STS,
                endpoint: self.Url.protocol + '//' + self.Url.hostname + self.Login
            };
            RestService._RequestToken(options, function (err, data) {
                if (err) {
                    callback(err, null);
                    return;
                }
                self.FedAuth = data.FedAuth;
                self.rtFa = data.rtFa;
                callback(null, data);
            });
        };
        RestService.prototype.GetList = function (name) {
            var list = new SP.List(this, name);
            return list;
        };
        RestService.prototype.Request = function (options, next) {
        };
        RestService.prototype.Metadata = function (next) {
            var options = new MetadataOptions('$metadata', 'application/xml', 'GET');
            this.Request(options, next);
        };
        RestService._BuildSamlRequest = function (params) {
            var saml = samlRequestTemplate;
            for (var key in params) {
                saml = saml.replace('[' + key + ']', params[key]);
            }
            return saml;
        };
        RestService._ParseXml = function (xml, callback) {
            var parser = new xml2js.Parser({
                emptyTag: ''
            });
            parser.on('end', function (js) {
                callback && callback(js);
            });
            parser.parseString(xml);
        };
        RestService._ParseCookie = function (txt) {
            var properties = txt.split('; ');
            var cookie = new Cookie('', '');
            properties.forEach(function (property, index) {
                var idx = property.indexOf('='), name = (idx > 0 ? property.substring(0, idx) : property), value = (idx > 0 ? property.substring(idx + 1) : undefined);
                if (index === 0) {
                    cookie.Name = name;
                    cookie.Value = value;
                }
                else {
                    cookie.Name = value;
                }
            });
            return cookie;
        };
        RestService._ParseCookies = function (txts) {
            var _this = this;
            var cookies = [];
            if (txts) {
                txts.forEach(function (txt) {
                    var cookie = _this._ParseCookie(txt);
                    cookies.push(cookie);
                });
            }
            return cookies;
        };
        RestService._GetCookie = function (cookies, name) {
            var cookie;
            var len = cookies.length;
            for (var i = 0; i < len; i++) {
                cookie = cookies[i];
                if (cookie.name == name) {
                    return cookie;
                }
            }
            return undefined;
        };
        RestService._SubmitToken = function (params, callback) {
            var token = params.token, url = urlparse(params.endpoint), ssl = (url.protocol == 'https:');
            var options = {
                method: 'POST',
                host: url.hostname,
                path: url.path,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Win64; x64; Trident/5.0)'
                }
            };
            var protocol = (ssl ? https : http);
            var req = protocol.request(options, function (res) {
                var xml = '';
                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    xml += chunk;
                });
                res.on('end', function () {
                    var cookies = RestService._ParseCookies(res.headers['set-cookie']);
                    callback(null, {
                        FedAuth: RestService._GetCookie(cookies, 'FedAuth').value,
                        rtFa: RestService._GetCookie(cookies, 'rtFa').value
                    });
                });
            });
            req.end(token);
        };
        RestService._RequestToken = function (params, callback) {
            var samlRequest = RestService._BuildSamlRequest({
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
            var req = https.request(options, function (res) {
                var xml = '';
                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    xml += chunk;
                });
                res.on('end', function () {
                    (xml, function (js) {
                        if (js['S:Envelope']['S:Body'][0] && js['S:Envelope']['S:Body'][0]['S:Fault']) {
                            var error = js['S:Envelope']['S:Body'][0]['S:Fault'][0]['S:Detail']['psf:error']['psf:internalerror']['psf:text'];
                            callback(error);
                            return;
                        }
                        var token = js['S:Envelope']['S:Body']['wst:RequestSecurityTokenResponse']['wst:RequestedSecurityToken']['wsse:BinarySecurityToken']['#'];
                        RestService._SubmitToken({
                            token: token,
                            endpoint: params.endpoint
                        }, callback);
                    });
                });
            });
            req.end(samlRequest);
        };
        return RestService;
    })();
    SP.RestService = RestService;
    var List = (function () {
        function List(service, name) {
        }
        return List;
    })();
    SP.List = List;
})(SP || (SP = {}));
module.exports = SP;
