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
        RestService.prototype._BuildSamlRequest = function (params) {
            var key, saml = samlRequestTemplate;
            for (key in params) {
                saml = saml.replace('[' + key + ']', params[key]);
            }
            return saml;
        };
        RestService.prototype._ParseXml = function (xml, callback) {
            var parser = new xml2js.Parser({
                emptyTag: ''
            });
            parser.on('end', function (js) {
                callback && callback(js);
            });
            parser.parseString(xml);
        };
        RestService.prototype._ParseCookie = function (txt) {
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
        ;
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
