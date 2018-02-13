const {
  last,
  set,
  isEqual,
  get,
  keys,
  assign,
  pull
} = require('lodash');
const p = require('path');
const assert = require('assert');

class MockRef {

  constructor(data = {}, path = [], subs = {}) {
    if (typeof path === 'string') {
      this._path = path.split('/');
    } else {
      this._path = path;
    }
    this._data = data;
    this._subscriptions = subs;
  }

  get key() {
    return last(this._path);
  }

  get parent() {
    return this._path.length === 0 ?
      null :
      new MockRef(this._data, this._path.slice(0, -1), this._subscriptions)
  }

  get root() {
    return this._path.length === 0 ?
      this :
      new MockRef(this._data, [], this._subscriptions);
  }

  get ref() {
    return this;
  }

  toString() {
    return "MockRef: " + this._path.join('/');
    f
  }

  _get() {
    return this._path.length > 0 ? get(this._data, this._path) : this._data;
  }

  child(path) {
    return new MockRef(this._data, [
        ...this._path,
        ...('' + path).split('/')
      ],
      this._subscriptions);
  }

  set(value) {
    if (value === null) {
      return this.remove();
    } else {
      set(this._data, this._path, value);
      this._notify('value');
      return Promise.resolve(this);
    }
  }

  _subs(event) {
    return ((this._path.length > 0 ? get(this._subscriptions, this._path) : this._data) || {})[event] || [];
  }

  _notify(event) {
    this._subs(event).forEach(sub => sub(this.snap()))
    if (this.parent) {
      this.parent._notify(event);
    }
  }

  update(value) {
    if (value !== null) {
      var parent = this.parent._get();
      if (parent) {
        parent[this.key] = assign(parent[this.key] || {}, value);
        return Promise.resolve()
      } else {
        return this.set(value);
      }
    }
  }

  push(value) {
    var ref = this.child(keys(get(this._data, this._path)).length); //NOTE: this will crap out if you delete old ones
    if (value) {
      return ref.set(value);
    } else {
      return ref;
    }
  }

  snap() {
    const val = this._get() || null;
    return {
      ref: this,
      val: () => val,
      key: this.key
    }
  }

  once(event) {
    assert(event === 'value', "fbmock only knows how to once('value')");
    return Promise.resolve(this.snap());
  }

  on(event, cb) {
    assert(event === 'value', "fbmock only knows how to on('value')");
    cb(this.snap());
    var subs = this._subs(event);
    subs.push(cb);
    set(this._subscriptions, [...this._path, event], subs);
  }

  off(event, cb) {
    assert(event === 'value', "fbmock only knows how to on('value')");
    var subs = this._subs(event);
    pull(subs, cb);
  }

  remove() {
    if (this._path.length > 0) {
      var o = this.parent._get() || this._data;
      delete o[this.key];
      if (Object.keys(o).length === 0) {
        var par = this.parent;
        if (par)
          par.remove();
      }
    }
    return Promise.resolve();
  }

  transaction(mutator) {
    var newval = mutator(this._get());
    if (typeof newval !== 'undefined') {
      this.set(newval);
    }
    return Promise.resolve({
      committed: typeof newval !== 'undefined',
      snapshot: {
        ref: this,
        val: () => this._get(),
        key: this.key
      }
    });
  }

  isEqual(other) {
    return isEqual(this._path, other._path) && this._data === other._data;
  }
}

module.exports = MockRef;