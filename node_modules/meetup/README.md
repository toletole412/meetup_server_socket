# Meetup js

A node.js interface for the [meetup.com](http://www.meetup.com/) api based roughly on [node-twitter](https://github.com/jdub/node-twitter)

## usage

This library supports both stream and low-level REST client interfaces.

The `stream` interface takes a path of the streamed resource you wish to consume and a function callback which will be provided a stream object. You can register a listener on one of the following event names.

* data - emits an single item from the stream
* error - emits an error throwing in processing of stream

Below is an example set up

    var Meetup = require("meetup")
    var mup = new Meetup()
    mup.stream("/2/rsvps", function(stream){
      stream
        .on("data", function(item){
          console.log("got item " + item)
        }).on("error", function(e) {
           console.log("error! " + e)
        });
    });    

The `REST` interface supports a `get` and `post` interface. 
These REST interfaces require authentication with Meetup before they can be used.

     var Meetup = require("meetup")
     var mup = new Meetup({
       clientId:"YOUR_CLIENT_ID"
       , clientSecret:"YOUR_CLIENT_SECRET"
       , redirectUri:"YOUR_REDIRECT_URI"
       })

Once configured, you can redirect the user-agent to the url returned by `mup.getAuthorizeUrl()`. Once the user authorizes your client their user-agent will be redirected back to YOUR_REDIRECT_URI with a `code` needed to obtain an access token.

    mup.getAccessToken(code, function(err, access, refresh, others) {
        if (err) {
           // do something about it
        } else {
           // at this point mup is automatically configured with the access token
           // you are free to start making requests here
        }
    })
    
Once you have an access token you can make requests in the form.

    mup.get("/2/member/self", function(err, data){
      console.log("got data " + data)
    })
