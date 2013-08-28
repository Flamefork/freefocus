jasmine.getFixtures().fixturesPath = '/base/test/fixtures'

beforeEach -> loadFixtures 'grid.html'

describe "$.fn.freefocus", ->
  it "should move to straight nearby targets", ->
    expect_focus '.p10', ->
      $('.p11').freefocus move: 'left', targets: $('.grid>div')
    expect_focus '.p12', ->
      $('.p11').freefocus move: 'right', targets: $('.grid>div')
    expect_focus '.p01', ->
      $('.p11').freefocus move: 'up', targets: $('.grid>div')
    expect_focus '.p21', ->
      $('.p11').freefocus move: 'down', targets: $('.grid>div')

  it "should move to distant targets in specified direction", ->
    expect_focus '.p43', ->
      $('.p23').freefocus move: 'down', targets: $('.grid>div')
    expect_focus '.p50', ->
      $('.p43').freefocus move: 'down', targets: $('.grid>div')

  it "should not move if no targets match", ->
    $('.p50').trigger('focus')
    $('.p50').freefocus move: 'down', targets: $('.grid>div')
    expect($('.p50')).toBeFocused() # expect it to stay focused

  it "should ignore empty targets", ->
    $('.p11').trigger('focus')
    $('.p11').freefocus move: 'right', targets: $('bogus')
    expect($('.p11')).toBeFocused()

  it "should trigger specified event", ->
    spy = spyOnEvent('.p10', 'navigate')
    $('.p11').freefocus move: 'left', targets: $('.grid>div'), trigger: 'navigate'
    expect(spy).toHaveBeenTriggered()
    spy.reset()

  it "should be affected by weight_fn logic", ->
    expect_focus '.p39', ->
      $('.p30').freefocus move: 'right', targets: $('.grid>div'), weight_fn: ({to: [to]}) -> $(to).is('.p39')
    expect_focus '.p30', ->
      $('.p39').freefocus move: 'left', targets: $('.grid>div'), weight_fn: ({angle, distance}) -> distance if angle < 1

describe "$.freefocus", ->
  afterEach -> $.freefocus 'remove'

  it "should work out of box", ->
    $.freefocus()

    $('.p11').trigger('focus')
    expect_focus '.p12', -> press_key 'right'
    expect_focus '.p22', -> press_key 'down'
    expect_focus '.p21', -> press_key 'left'
    expect_focus '.p11', -> press_key 'up'
