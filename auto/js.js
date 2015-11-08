
// listen to on key up, blur change
window.jq = {  
  create: function (type, cssClass, parent, attrs){    
    attrs = attrs || {};
    if(attrs.text){
      attrs.textContent = attrs.text;
      delete attrs.text;
    }  
    if(type === 'img')  attrs.alt = attrs.alt || 'image';
    var element = document.createElement(type), key;
    if(cssClass) element.className = cssClass;
    if(parent) parent.appendChild(element);
    for(key in attrs) element[key] = attrs[key];
    return element;
  },
  id: function (id, parent){
    parent = parent || document;
    return parent.getElementById(id);
  },
  select: function(key, parent){
    parent = parent || document;
    return jq.col2aryy(parent.querySelectorAll(key));
  },
  col2aryy: function (collection){
    if(!collection || !collection.length) return [];
    var arry=[], i;
    for(i=0;i<collection.length;i++){
      arry.push(collection[i]);
    }
    return arry;
  },
  class: function (cssClass, parent){
    parent = parent || document;
    return this.col2aryy(parent.getElementsByClassName(cssClass));   
  },
  tag: function (cssClass, parent){
    parent = parent || document;
    return this.col2aryy(parent.getElementsByTagName(cssClass));   
  },
  name: function (name, parent){
    parent = parent || document;
    return this.col2aryy(parent.getElementsByName(name));   
  },
  get: function(searchTerm, paramObj){
    paramObj = paramObj || {};
    var url = "https://api.viki.io/v4/search.json",
        defaultParams = {
          c: searchTerm || '',
          per_page: 5,
          with_people: true,
          app: '100266a',
          timestamp: Date.now()
        },
        key, params=[];

    for(key in paramObj)  defaultParams[key] = paramObj[key];
    for(key in defaultParams)  params.push(key+'='+defaultParams[key]);
    url+= '?'+params.join('&');
    return new Promise(function(resolve, reject){
      var request = new XMLHttpRequest();
      request.open('GET', url, true);
      console.log('request url: ', url);
      request.onload = function() {
        if (request.status >= 200 && request.status < 400) {
          resolve(JSON.parse(request.responseText));
        } else {
          reject("Some error occured, status code: ", request.status);
        }
      };
      request.onerror = reject;
      request.send();
    });
  },
  clear: function(element){
    element.innerHTML = '';
  },
  ready: function(fn){
    document.addEventListener("DOMContentLoaded", fn);
  }, 
  text: function(element, text){
    element.textContent = text;
  },
  listen: function(element, type, fn){
    if(type.indexOf(' ')>-1){ // case of multiple events
      type.split(' ').forEach(function(evt){
        element.addEventListener(evt, fn);
      });
    }else{
      element.addEventListener(type, fn);
    }    
  }
};

function onReady(){
  results = jq.id('results');
  searchBox = jq.id('searchBox');
  searchBox.value='';
  searchBox.focus();
  jq.clear(results);
  jq.listen(searchBox, 'change keyup', listener);  
}

function listener(){
  if(delayedCall) clearTimeout(delayedCall);
  delayedCall = setTimeout(doSearch, delayTime);
}

function doSearch(){
  jq.get(searchBox.value).then(buildResults).catch(console.error.bind(console));
}

function buildResults(items){
  jq.clear(results);
  items.forEach(buildResult);
}

function buildResult(item){

  item = item || {};
  ['id', 'tt', 'e', 't'].forEach(function(k){item[k]=item[k]?item[k]:'';});  // if value not present substitute it with empty

  var result = jq.create('div', ['item', item.id].join(' '), results),
      left = jq.create('div', 'left', result),
      middle = jq.create('div', 'middle', result),
      right = jq.create('div', 'right', result),
      img = jq.create('img', 'thumb', left, {src: item.i}),
      title = jq.create('a', 'title', middle, {text: item.tt, href: viki+item.u.w }),
      desc = jq.create('div', 'desc', middle),
      type = jq.create('div', 'type', desc, {text: item.t}),
      button = jq.create('div', 'button', right),
      a;
      if(item.t === 'series')
        jq.create('div', 'episodes', desc, {text: 'episodes: '+ item.e} )
      
      if(!item.blocked)
        a = jq.create('a', null, button, {href: viki+item.u.w, text: 'click here to watch'});
      else
        a = jq.create('div', 'blocked', button, {text: 'content not available'});
      if(item.t === 'person')
        jq.clear(right);

      
}


var results, searchBox, delayedCall, delayTime = 500, viki='http://www.viki.com';
jq.ready(onReady);


