module.exports = (config) ->
  config.set
    basePath: ''
    port: 9876
    colors: true
    autoWatch: true
    captureTimeout: 5000
    singleRun: false
    logLevel: config.LOG_INFO

    frameworks: ["jasmine"]
    files: [
      "bower_components/jquery/jquery.js",
      "bower_components/jasmine-jquery/lib/jasmine-jquery.js",
      "jquery.freefocus.js",
      "test/helpers.js",
      "test/specs.coffee",
      {pattern: "test/fixtures.html", included: false}
    ]
    exclude: []

    preprocessors:
      "**/*.coffee": ["coffee"]

#    reporters: ['coverage']
    reporters: ["progress"]

#    browsers: ["Chrome"]
    browsers: ['PhantomJS']
