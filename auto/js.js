
// listen to on key up, blur change
window.jq = {  
  create: function (type, cssClass, parent, attrs){    
    attrs = attrs || {};
    var element = document.createElement(type), key;
    if(cssClass) element.className = cssClass;
    if(parent) parent.appendChild(element);
    for(key in attrs) element[key] = attr[key];
    return element;
  },
  id: function (id, parent){
    return jq.col2aryy(parent.getElementById(id));
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
  }
};