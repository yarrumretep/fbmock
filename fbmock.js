const {
  last,
  set,
  isEqual,
  get,
  keys,
  assign
} = require('lodash');
const p = require('path');

class MockRef {

  constructor(data = {}, path = []) {
    if (typeof path === 'string') {
      this._path = path.split('/');
    } else {
      this._path = path;
    }
    this._data = data;
  }

  get key() {
    return last(this._path);
  }

  get parent() {
    return this._path.length === 0 ?
      null :
      new MockRef(this._data, this._path.slice(0, -1))
  }

  get root() {
    return this._path.length === 0 ?
      this :
      new MockRef(this._data, []);
  }

  get ref() {
    return this;
  }

  toString() {
    return "MockRef: " + this._path.join('/');
  }

  _get() {
    return this._path.length > 0 ? get(this._data, this._path) : this._data;
  }

  child(path) {
    return new MockRef(this._data, [
      ...this._path,
      ...('' + path).split('/')
    ]);
  }

  set(value) {
    if (value === null) {
      return this.remove();
    } else {
      set(this._data, this._path, value);
      return Promise.resolve(this);
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

  once(event) {
    return Promise.resolve({
      ref: this,
      val: () => this._get(),
      key: this.key
    });
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
        ref:this,
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
