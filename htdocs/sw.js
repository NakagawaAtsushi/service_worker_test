self.addEventListener("install", function(event){
  return event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", function(event){
  return event.waitUntil(self.clients.claim());
});

  var allowedHosts = /localhost/i;
  var airListApi = /json\/.*sec/i;
  var airListHtmlWhite = /list\.html\?(.*key=.*)$/i;
  var airListHtmlBlack = /sw=false/i;

var dummy = /dummy/;

self.addEventListener("fetch", function(event){

  if(allowedHosts.test(event.request.url) === true ){

    if(dummy.test(event.request.url) === true){
      console.log("dummy2" + new Date().toISOString());
      event.respondWith(
         fetch('/dummy2').then(function(response){
             return response.clone();
         })
      );
    }

    if(airListHtmlWhite.test(event.request.url) === true &&
      airListHtmlBlack.test(event.request.url) === false){

       var params = airListHtmlWhite.exec(event.request.url)[1];

       beginFetch('/json/3sec?' + params);
       beginFetch('/json/10sec?' + params);
    }
    else if(airListApi.test(event.request.url) === true){
       if(existFetch(event.request.url)){
           event.respondWith(
              waitAndGetResponse(event.request.url)
           );
       }
     }
  }
});

var promisesOfFetch = {};

var beginFetch = function(url){
  if( url in promisesOfFetch ){
    return;
  }
  promisesOfFetch[url] = fetch(url);
}

var existFetch = function(url){
  var keys = Object.keys(promisesOfFetch);
  for(var i = 0; i < keys.length; i++){
    var key = keys[i];
    if( url.indexOf(key) >= 0){
      return key;
    }
  }
  return false;
}

var waitAndGetResponse = function(url){  
  var key = existFetch(url);  
  return promisesOfFetch[key].then(function(response){
    if( response.status == 200){
      return response.clone();
    }
    delete promisesOfFetch[key];
    return response.clone();
  },(error)=>{
    delete promisesOfFetch[key];
    console.error("error:", error.message);
    return error;
  });
}
