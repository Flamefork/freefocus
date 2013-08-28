module.exports = (grunt) ->
  require("matchdep").filterDev("grunt-*").forEach grunt.loadNpmTasks

  grunt.initConfig
    clean:
      all: [".tmp", "dist/*", "!dist/.git*"]

    coffeelint:
      all: ["src/*.coffee", "test/spec/*.coffee"]
      options: JSON.parse(grunt.file.read("coffeelint.json"))

    coffee:
      dist:
        files:
          "dist/jquery.freefocus.js": ["src/*.coffee"]

    karma:
      continuos:
        configFile: "karma.conf.js"
      check:
        configFile: "karma.conf.js"
        singleRun: true

    uglify:
      dist:
        files:
          "dist/jquery.freefocus.min.js": ["dist/jquery.freefocus.js"]

    docco:
      docs:
        src: ['src/*.coffee']
        options:
          output: 'docs'

    "gh-pages":
      options:
        base: "docs"
      src: ["**"]

  grunt.registerTask "test", [
    "coffeelint",
    "karma:continuos"
  ]

  grunt.registerTask "build", [
    "clean",
    "coffee",
    "uglify"
  ]

  grunt.registerTask "default", [
    "coffeelint",
    "karma:check",
    "build"
  ]

  grunt.registerTask "update-docs", [
    "docco",
    "gh-pages"
  ]
