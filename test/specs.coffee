jasmine.getFixtures().fixturesPath = '/base/test'

beforeEach -> loadFixtures 'fixtures.html'

describe "$.fn.freefocus", ->
  it "should move to straight targets", ->
    $('#p09').freefocus move: 'left', targets: $('.grid>div')
    expect($('#p08')).toBeFocused()
    $('#p09').freefocus move: 'right', targets: $('.grid>div')
    expect($('#p21')).toBeFocused()
    $('#p09').freefocus move: 'up', targets: $('.grid>div')
    expect($('#p07')).toBeFocused()
    $('#p09').freefocus move: 'down', targets: $('.grid>div')
    expect($('#p11')).toBeFocused()

  it "should not move if no targets match", ->
    $('#p08').trigger('focus')
    $('#p08').freefocus move: 'left', targets: $('.grid>div')
    expect($('#p08')).toBeFocused() # expect it to stay focused

  it "should ignore empty targets", ->
    $('#p11').trigger('focus')
    $('#p11').freefocus move: 'right', targets: $('bogus')
    expect($('#p11')).toBeFocused()

  it "should trigger specified event", ->
    spy = spyOnEvent('#p08', 'navigate')
    $('#p09').freefocus move: 'left', targets: $('.grid>div'), trigger: 'navigate'
    expect(spy).toHaveBeenTriggered()
    spy.reset()

  it "should move according to directional navigation css properties", ->
    $('#p10').attr('style', 'nav-bottom: #p11');
    $('#p10').freefocus move: 'bottom', targets: $('.grid>div'), useNavProps: true
    expect($('#p11')).toBeFocused()

  it "should move according to directional navigation style properties", ->
    $('#p11').get(0).style.navBottom = '#p10'
    $('#p11').freefocus move: 'bottom', targets: $('.grid>div'), useNavProps: true
    expect($('#p10')).toBeFocused()

describe "$.freefocus", ->
  afterEach -> $.freefocus 'remove'

  it "should work out of box", ->
    $.freefocus()

    $('#p04').trigger('focus')
    pressKey 'left'
    expect($('#p03')).toBeFocused()
    pressKey 'down'
    expect($('#p05')).toBeFocused()
    pressKey 'right'
    expect($('#p06')).toBeFocused()
    pressKey 'up'
    expect($('#p04')).toBeFocused()

