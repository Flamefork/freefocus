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
    $('#p10').attr('style', 'nav-down: #p11');
    $('#p10').freefocus move: 'down', targets: $('.grid>div'), useNavProps: true
    expect($('#p11')).toBeFocused()

  it "should move according to directional navigation style properties", ->
    $('#p11').get(0).style.navDown = '#p10'
    $('#p11').freefocus move: 'down', targets: $('.grid>div'), useNavProps: true
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

  it "should behave in WICD-specified way", ->
    $.freefocus()
    $('#p00').trigger('focus') # 1
    pressKey 'down'
    expect($('#p02')).toBeFocused() # 2
    pressKey 'down'
    expect($('#p04')).toBeFocused() # 3
    pressKey 'left'
    expect($('#p03')).toBeFocused() # 4
    pressKey 'down'
    expect($('#p05')).toBeFocused() # 5
    pressKey 'right'
    expect($('#p06')).toBeFocused() # 6
    pressKey 'down'
    expect($('#p07')).toBeFocused() # 7
    pressKey 'down'
    expect($('#p09')).toBeFocused() # 8
    pressKey 'right'
    expect($('#p21')).toBeFocused() # 9
    pressKey 'up'
    expect($('#p20')).toBeFocused() # 10
    pressKey 'up'
    expect($('#p14')).toBeFocused() # 11
    pressKey 'up'
    expect($('#p13')).toBeFocused() # 12
    pressKey 'up'
    expect($('#p12')).toBeFocused() # 13
    pressKey 'down'
    expect($('#p13')).toBeFocused() # 14
    pressKey 'right'
    expect($('#p15')).toBeFocused() # 15
    pressKey 'up'
    expect($('#p12')).toBeFocused() # 16
    pressKey 'down'
    expect($('#p15')).toBeFocused() # 17
    pressKey 'right'
    expect($('#p16')).toBeFocused() # 18
    pressKey 'up'
    expect($('#p12')).toBeFocused() # 19
    pressKey 'down'
    expect($('#p16')).toBeFocused() # 20
    pressKey 'down'
    expect($('#p18')).toBeFocused() # 21
    pressKey 'left'
    expect($('#p17')).toBeFocused() # 22
    pressKey 'down'
    expect($('#p19')).toBeFocused() # 23
    pressKey 'down'
    expect($('#p20')).toBeFocused() # 24
    pressKey 'down'
    expect($('#p22')).toBeFocused() # 25
    pressKey 'down'
    expect($('#p23')).toBeFocused() # 26
    pressKey 'right'
    expect($('#p24')).toBeFocused() # 27
    pressKey 'down'
    expect($('#p24')).toBeFocused() # end
