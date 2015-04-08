module.exports = function(grunt) {
  grunt.initConfig({
    coffee: {
      src: {
        files: {
          'dist/flux.js': ['src/flux.coffee']
        },
      },
      test: {
        files: {
          'test/dist/flux_spec.js': ['test/flux_spec.coffee']
        },
      },
    },
  });

  grunt.loadNpmTasks('grunt-contrib-coffee');
};
