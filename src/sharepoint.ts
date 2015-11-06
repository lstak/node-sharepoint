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
            callback: (ev: Event) => any): void {

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

        private _BuildSamlRequest(params: any): any {
            var key, saml = samlRequestTemplate;

            for (key in params) {
                saml = saml.replace('[' + key + ']', params[key]);
            }
            return saml;
        }

        private _ParseXml(xml: string, callback: (ev: Event) => any): void {
            var parser = new xml2js.Parser({
                emptyTag: ''  // use empty string as value when tag empty
            });

            parser.on('end', function(js) {
                callback && callback(js);
            });

            parser.parseString(xml);
        }

        private _ParseCookie(txt: string): any {
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
        };
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