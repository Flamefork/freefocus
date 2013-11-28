jasmine.getFixtures().fixturesPath = '/base/test'

beforeEach -> loadFixtures 'fixtures.html'

describe "$.fn.freefocus", ->
  it "should move to straight nearby targets", ->
    expectFocus '#p10', ->
      $('#p11').freefocus move: 'left', targets: $('.grid>div')
    expectFocus '#p12', ->
      $('#p11').freefocus move: 'right', targets: $('.grid>div')
    expectFocus '#p01', ->
      $('#p11').freefocus move: 'up', targets: $('.grid>div')
    expectFocus '#p21', ->
      $('#p11').freefocus move: 'down', targets: $('.grid>div')

  it "should move to distant targets in specified direction", ->
    expectFocus '#p43', ->
      $('#p23').freefocus move: 'down', targets: $('.grid>div')
    expectFocus '#p50', ->
      $('#p43').freefocus move: 'down', targets: $('.grid>div')

  it "should not move if no targets match", ->
    $('#p50').trigger('focus')
    $('#p50').freefocus move: 'down', targets: $('.grid>div')
    expect($('#p50')).toBeFocused() # expect it to stay focused

  it "should ignore empty targets", ->
    $('#p11').trigger('focus')
    $('#p11').freefocus move: 'right', targets: $('bogus')
    expect($('#p11')).toBeFocused()

  it "should trigger specified event", ->
    spy = spyOnEvent('#p10', 'navigate')
    $('#p11').freefocus move: 'left', targets: $('.grid>div'), trigger: 'navigate'
    expect(spy).toHaveBeenTriggered()
    spy.reset()

  it "should be affected by weightFn logic", ->
    expectFocus '#p39', ->
      $('#p30').freefocus move: 'right', targets: $('.grid>div'), weightFn: ({to: [to]}) -> $(to).is('#p39')
    expectFocus '#p30', ->
      $('#p39').freefocus move: 'left', targets: $('.grid>div'), weightFn: ({angle, distance}) -> distance if angle < 1

  it "should move according to directional navigation css properties", ->
    expectFocus '#p10', ->
      $('#p09').freefocus move: 'right', targets: $('.grid>div'), useNavProps: true
    expectFocus '#p16', ->
      $('#p15').freefocus move: 'right', targets: $('.grid>div'), useNavProps: true

describe "$.freefocus", ->
  afterEach -> $.freefocus 'remove'

  it "should work out of box", ->
    $.freefocus()

    $('#p11').trigger('focus')
    expectFocus '#p12', -> pressKey 'right'
    expectFocus '#p22', -> pressKey 'down'
    expectFocus '#p21', -> pressKey 'left'
    expectFocus '#p11', -> pressKey 'up'
