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
    return ref.set('bar').then(() => ref.once()).then(snap => expect(snap.val()).toBe('bar'));
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

  it('should remove', () => {
    var ref = new MockRef().child('foo/bar');
    return ref.set('hello world').then(() => ref.remove()).then(() => ref.once()).then(snap => expect(snap.val()).toBeUndefined());
  })

  it('should transaction', () => {
    var ref = new MockRef().child('foo/bar');
    return ref.transaction(current => {
        expect(current).toBeUndefined();
        return true;
      })
      .then(result=>expect(result.committed).toBe(true))
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
      .then(result=>expect(result.committed).toBe(false))
      .then(() => ref.once('value'))
      .then(snap => expect(snap.val()).toBe(true))
  })
})
