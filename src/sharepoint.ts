/// <reference path='../typings/node/node.d.ts' />

'use strict';

var fs = require('fs');
var qs = require('querystring');
var xml2js = require('xml2js');
var http = require('http');
var https = require('https');
var urlparse = require('url').parse;
var samlRequestTemplate = fs.readFileSync(__dirname + '/SAML.xml', 'utf8');

/**SharePoint Connection Module */
module SP {
    /**SharePoint Connection Metadata */
    class MetadataOptions {
        public List: string;
        public Accept: string;
        public Method: string;
        
        /**Instantiates an Object with Connection Metadata  */
        public constructor(
            /**List Name */
            list: string,
            /**Accepted return Content-Type */
            accept: string, 
            /**The Verb Method for the Request */
            method: string) {
            this.List = list;
            this.Accept = accept;
            this.Method = method;
        }
    }

    class Cookie {
        public Name: string;
        public Value: string;

        public constructor(name: string, value: string) {
            this.Name = name;
            this.Value = value;
        }
    }
    
    /**REST Requests Service */
    export class RestService {
        private Url: any;
        private Host: string;
        private Path: string;
        private Protocol: string;

        private STS: {
            Host: string;
            Path: string;
        }
        private Login: string;
        private ODataEndPoint: string;
        private FedAuth: string;
        private rtFa: string;
        
        /**Instantiates a new Instance of the REST Requests Service */
        public constructor(
            /**The SharePoint Site URL */
            url: any) {

            this.Url = urlparse(url);
            this.Host = this.Url.host;
            this.Path = this.Url.path;
            this.Protocol = this.Url.protocol;
            
            // External Security Token Service for SPO
            this.STS = {
                Host: 'login.microsoftonline.com',
                Path: '/extSTS.srf'
            };

            // Form to submit SAML token
            this.Login = '/_forms/default.aspx?wa=wsignin1.0';

            // SharePoint Odata (REST) service
            this.ODataEndPoint = '/_vti_bin/ListData.svc/';
        }
        
        /**Requests the Sign in of the informed user */
        public SignIn(
            /**User Login Name */
            username: string, 
            /**User Password */
            password: string, 
            /**Callback Function for the Login Event */
            callback: (error: any, data: any) => any): void {
            var self = this;

            var options = {
                username: username,
                password: password,
                sts: self.STS,
                endpoint: self.Url.protocol + '//' + self.Url.hostname + self.Login
            }

            RestService._RequestToken(options, function(err, data) {

                if (err) {
                    callback(err, null);
                    return;
                }

                self.FedAuth = data.FedAuth;
                self.rtFa = data.rtFa;

                callback(null, data);
            })
        }
        
        
        /**Requests a SP.List Object */
        public GetList(
            /**Name of the required List */
            name: string): List {
            var list = new SP.List(this, name)
            return list;
        }

        public Request(options: any, next: (ev: Event) => any): void {
        }

        public Metadata(next: (ev: Event) => any): void {
            var options = new MetadataOptions('$metadata', 'application/xml', 'GET');

            this.Request(options, next);
        }

        static _BuildSamlRequest(params: any): any {
            var saml = samlRequestTemplate;

            for (var key in params) {
                saml = saml.replace('[' + key + ']', params[key]);
            }
            return saml;
        }

        static _ParseXml(xml: string, callback: (ev: Event) => any): void {
            var parser = new xml2js.Parser({
                emptyTag: ''  // use empty string as value when tag empty
            });

            parser.on('end', (js: Event): void => {
                callback && callback(js);
            });

            parser.parseString(xml);
        }

        static _ParseCookie(txt: string): any {
            var properties = txt.split('; ');
            var cookie = new Cookie('', '');

            properties.forEach(function(property, index) {
                var idx = property.indexOf('='),
                    name = (idx > 0 ? property.substring(0, idx) : property),
                    value = (idx > 0 ? property.substring(idx + 1) : undefined);

                if (index === 0) {
                    cookie.Name = name;
                    cookie.Value = value;
                } else {
                    cookie.Name = value
                }

            })

            return cookie;
        }

        static _ParseCookies(txts: Array<string>): any {
            var cookies = [];

            if (txts) {
                txts.forEach((txt: string): void => {
                    var cookie = this._ParseCookie(txt);
                    cookies.push(cookie)
                });
            }

            return cookies;
        }

        static _GetCookie(cookies: Array<string>, name: string): any {
            var cookie;
            var len = cookies.length;

            for (var i = 0; i < len; i++) {
                cookie = cookies[i]
                if (cookie.name == name) {
                    return cookie
                }
            }

            return undefined;
        }

        static _SubmitToken(params: any, callback: any): any {
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

                    var cookies = RestService._ParseCookies(res.headers['set-cookie'])

                    callback(null, {
                        FedAuth: RestService._GetCookie(cookies, 'FedAuth').value,
                        rtFa: RestService._GetCookie(cookies, 'rtFa').value
                    })
                })
            });

            req.end(token);
        }

        static _RequestToken(params, callback): void {
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

            var req = https.request(options, function(res) {
                var xml = '';

                res.setEncoding('utf8');
                res.on('data', function(chunk) {
                    xml += chunk;
                })

                res.on('end', function() {

                    (xml, function(js) {

                        // check for errors
                        if (js['S:Envelope']['S:Body'][0] && js['S:Envelope']['S:Body'][0]['S:Fault']) {
                            var error = js['S:Envelope']['S:Body'][0]['S:Fault'][0]['S:Detail']['psf:error']['psf:internalerror']['psf:text'];
                            callback(error);
                            return;
                        } 

                        // extract token
                        var token = js['S:Envelope']['S:Body']['wst:RequestSecurityTokenResponse']['wst:RequestedSecurityToken']['wsse:BinarySecurityToken']['#'];

                        // Now we have the token, we need to submit it to SPO
                        RestService._SubmitToken({
                            token: token,
                            endpoint: params.endpoint
                        }, callback)
                    })
                })
            });

            req.end(samlRequest);
        }
    }
    
    /**Auxiliar Methods to Deal with SharePoint Lists */
    export class List {
        /**Instantiates an auxiliar object to deal with the List */
        public constructor(
            /**Service Name */ //TODO: Improve Documentation
            service: RestService, 
            /**List Name */
            name: string) {
        }
    }
}

module.exports = SP;