class Observable{

  constructor(){
    this.observers = new Array();
  }

  addObserver(observer, key){
    key = key || 'default';
    this.observers.push({key, observer});
  }

  notify(){
    this.observers.forEach(each => each.observer(...arguments));
  }

  removeObservers(key){
    this.observers = this.observers.filter(each => each.key!=key);
  }

  newValue(value1, value2){
    if(!value1 && !value2)  return false;
    if(!value1 || !value2)  return true;
    return value1!=value2;
  }
}


class TableDetails extends Observable{
  constructor(){
    super();
  }
}

class Query extends Observable{
  constructor(){
    super();
    this.num = 20;
    this.startTime = '';
    this.endTime = '';
    this.ip = '';
    this.cat = '';
    this.event = '';
    this.action = '';
    this.prio = '';
  }

}

class LogSources extends Observable{
  constructor(){
    super();
    this.sources = new Set();
  }

  list(){
    return Array.from(this.sources);
  }

  updateSources(newSources){
    var missing, added;
    newSources = new Set(newSources);
    added = Array.from(newSources).filter(item => !this.sources.has(item));
    missing = Array.from(this.sources).filter(item => !newSources.has(item));
    this.sources = newSources;
    this.notify({missing, added});
  }
}