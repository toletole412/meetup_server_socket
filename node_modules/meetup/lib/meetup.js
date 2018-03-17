var VERSION = '0.1.0-SNAPSHOT'
  , http = require('http')
  , oauth = require('oauth') // https://github.com/ciaranj/node-oauth
  , _     = require('lodash')
  , querystring = require('querystring')
  , streamParser = require('./parser')
  , URL = require('url');


function Meetup(options) {
    if (!(this instanceof Meetup)) return new Meetup(options);
    var defaults = {
        key: null
        , clientId: null
        , clientSecret: null
        , redirectUri: null
        , accessToken: null
        , baseSite: "https://secure.meetup.com"
        , authorizePath: "/oauth2/authorize"
        , accessTokenPath: "/oauth2/access"
        , restBase: "https://api.meetup.com"
        , streamBase: "http://stream.meetup.com"
    };
    this.options = _.extend(defaults, options);
    this.key = this.options.key;
    this.oauth = new oauth.OAuth2(
        this.options.clientId
        , this.options.clientSecret
        , this.options.baseSite
        , this.options.authorizePath
        , this.options.accessTokenPath);
}

Meetup.VERSION = VERSION
module.exports = Meetup;

/**
 * @param param - object containing additional params in authorize request. 
 *                this may contain the scope and state oauth2 param
 */
Meetup.prototype.getAuthorizeUrl = function(params) {
    return this.oauth.getAuthorizeUrl(_.extend({
        "response_type":"code",
        "redirect_uri": this.options.redirectUri
    }, params || {}));
}

/**
 * @param code - code received from user after obtaining user authorization from #getAuthorizeUrl(...)
 * @param callback - funciton that accepts two arguments: (error, accessToken, refreshToken, remainingParams)
 */
Meetup.prototype.getAccessToken = function(code, callback) {
    var self = this;
    this.oauth.getOAuthAccessToken(
        code
        , {
            "grant_type":"authorization_code",
            "redirect_uri":this.options.redirectUri
        }
        , function(err, access, refresh, results) {
            if (err) {
                callback(err);
            } else {
                self.options.accessToken = access;
                callback(null, access, refresh, results);
            }
        });
    return this;
}

Meetup.prototype.get = function(url, params, callback) {
    if (_.isFunction(params)) {
        callback = params;
        params = null;
    }
    if (! _.isFunction(callback)) {
        throw "Invalid callback";
        return this;
    };
    if (url.charAt(0) === '/') {
        url = this.options.restBase + url;
    }
    this.oauth.get(url + "?" + querystring.stringify(params),
                   this.options.accessToken,
                   callback);
    return this;
}

Meetup.prototype.post = function(url, content, contentType, callback) {
    if (_.isFunction(content)) {
        callback = content;
        content = null;
        contentType = null;
    } else if (_.isFunction(contentType)) {
        callback = contentType;
        contentType = null;
    }
    if (!_.isFunction(callback)) {
        throw "Invalid callback";
        return this;
    }

    if (url.charAt(0) === '/') {
        url = this.options.restBase + url;
    }

    // stringify boolean values for oauth
    if (content && typeof content === 'object') {
        Object.keys(content).forEach(function(e) {
            if (_.isBoolean(content[e])) {
                content[e] = content[e].toString();
            }
        });
    }

    this.oauth._request(
        "POST"
        , url
        , { "Content-Type": contentType }
        , content
        , self.options.accessToken
        , callback
    );
    return this;
}

Meetup.prototype.stream = function(path, params, callback) {
    if (_.isFunction(params)) {
        callback = params;
        params = null;
    }
    var stream = new streamParser();
    stream.destroy = function() {
        if (_.isFunction(request.abort)) {
            request.abort()
        } else {
            request.socket.destroy();
        }
    };

    var url = path.charAt(0) === '/' ? this.options.streamBase +path : path;
    var parsedUrl = URL.parse(url, false);

    // http://nodejs.org/api/http.html#http_http_request_options_callback                               
    var request = http.request({
        host:  parsedUrl.hostname
        , port: parsedUrl.port || 80
        , path: path + "?" + querystring.stringify(params)
        , method: "GET"
        , headers: { "Accept": "*/*" }
    });

    request.on('response', function(response){
        response.on('data', function(chunk){
            stream.receive(chunk);
        });
        response.on('error', function(error){
            stream.emit('error', error);
        });
        response.on('end', function(){
            stream.emit('end', response);
        })
    });
    request.on('error', function(error) {
        stream.emit('error', error);
    });
    request.end();
    if (_.isFunction(callback)) {
        callback(stream);
    }
    return this;
}
