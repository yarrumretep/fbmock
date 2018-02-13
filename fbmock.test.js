var MockRef = require("./fbmock");

describe("FBMock", () => {

  it('should have ref', () => {
    var ref = new MockRef();
    expect(ref.ref).toBe(ref);
  })

  it('should have a key', () => {
    var ref = new MockRef().child('foo/bar');
    expect(ref.key).toBe('bar');
    expect(ref.parent.key).toBe('foo');
  })

  it('should have root', () => {
    var ref = new MockRef();
    var root = ref.child('foo/bar').root;
    expect(root.isEqual(ref)).toBe(true);
  })

  it('should set', () => {
    var ref = new MockRef().child('foo');
    return ref.set('bar').then(() => ref.once('value')).then(snap => expect(snap.val()).toBe('bar'));
  })

  it('should update', () => {
    var ref = new MockRef().child('foo');
    return ref.set({
        one: 1
      }).then(() => ref.update({
        two: 2
      }))
      .then(() => ref.once('value'))
      .then(snap => {
        expect(snap.val()).toEqual({
          one: 1,
          two: 2
        })
        expect(snap.ref.isEqual(ref)).toBe(true);
      })
  })

  it('should notify', () => {
    var ref = new MockRef().child('foo');
    var cb = jest.fn();
    ref.on('value', cb);
    return ref.set('hello')
      .then(() => ref.set('goodbye'))
      .then(() => {
        expect(cb.mock.calls.length).toBe(3);
        expect(cb.mock.calls[0][0].val()).toBeNull();
        expect(cb.mock.calls[1][0].val()).toBe('hello');
        expect(cb.mock.calls[2][0].val()).toBe('goodbye');
      })
  })

  it('should remove', () => {
    var ref = new MockRef().child('foo/bar');
    return ref.set('hello world').then(() => ref.remove()).then(() => ref.once('value')).then(snap => expect(snap.val()).toBeNull());
  })

  it('should transaction', () => {
    var ref = new MockRef().child('foo/bar');
    return ref.transaction(current => {
        expect(current).toBeUndefined();
        return true;
      })
      .then(result => expect(result.committed).toBe(true))
      .then(() => ref.once('value'))
      .then(snap => expect(snap.val()).toBe(true))
  })

  it('should transaction2', () => {
    var ref = new MockRef().child('foo/bar');
    return ref.set(true)
      .then(() => ref.transaction(current => {
        expect(current).toBe(true)
        return;
      }))
      .then(result => expect(result.committed).toBe(false))
      .then(() => ref.once('value'))
      .then(snap => expect(snap.val()).toBe(true))
  })
})