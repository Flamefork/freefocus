jasmine.getFixtures().fixturesPath = '/base/test/fixtures'

describe "Navigation in grid", ->
  beforeEach ->
    loadFixtures 'grid.html'
  it "should be true", ->
    expect($('[data-index]')).toExist()
