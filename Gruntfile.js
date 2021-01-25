/**
 * This file is used to build Handsontable documentation.
 *
 * Installation:
 * 1. Install Grunt CLI (`npm install -g grunt-cli`)
 * 1. Install Grunt 0.4.0 and other dependencies (`npm install`)
 *
 * Build:
 * Execute `npm run start` from root directory of this directory (where Gruntfile.js is)
 *
 * Result:
 * Building Handsontable docs will create files:
 *  - generated/*
 *
 * See http://gruntjs.com/getting-started for more information about Grunt
 */

var argv = require('minimist')(process.argv.slice(2));
var fs = require('fs');
var path = require('path');
var semver = require('semver');
var gitHelper = require('./git-helper');

module.exports = function(grunt) {
  var
    DOCS_PATH = 'generated',
    HOT_SRC_PATH = 'src/handsontable',
    HOT_DEFAULT_BRANCH = 'master',
    HOT_REPO = 'https://github.com/handsontable/handsontable.git',
    HOT_EQUIVALENT_VERSIONS = new Map([
      ['1.18.1', '0.38.1'],
      ['1.18.0', '0.38.0'],
      ['1.17.0', '0.37.0'],
      ['1.16.0', '0.36.0'],
      ['1.15.1', '0.35.1'],
      ['1.15.0', '0.35.0'],
      ['1.14.3', '0.34.3'],
      ['1.14.2', '0.34.2'],
      ['1.14.1', '0.34.1'],
      ['1.14.0', '0.34.0'],
    ]),
    querystring = require('querystring');

    function getHotBranch() {
      var hotVersion = argv['hot-version'];

      return hotVersion ? (hotVersion === 'latest' ? HOT_DEFAULT_BRANCH : hotVersion) : gitHelper.getLocalInfo().branch;
    }

    grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),

      clean: {
        dist: [DOCS_PATH],
        source: [HOT_SRC_PATH],
      },

      jsdoc: {
        only_tutorials: {
          src: [
            // jsdoc requires at least one js file, doesn't work otherwise
            'static/scripts/main.js',
          ],
          jsdoc: 'node_modules/.bin/' + (/^win/.test(process.platform) ? 'jsdoc.cmd' : 'jsdoc'),
          options: {
            verbose: true,
            destination: DOCS_PATH,
            configure: 'conf.json',
            tutorials: 'tutorials',
            template: './',
            'private': false,
            query: ''
          }
        },
        prod: {
          src: [
            HOT_SRC_PATH + '/src/**/*.js',
            '!' + HOT_SRC_PATH + '/src/**/*.spec.js',
            '!' + HOT_SRC_PATH + '/src/**/*.unit.js',
            '!' + HOT_SRC_PATH + '/src/**/*.e2e.js',
            '!' + HOT_SRC_PATH + '/src/3rdparty/walkontable/**/*.js',
            HOT_SRC_PATH + '/src/3rdparty/walkontable/src/cell/*.js',
          ],
          jsdoc: 'node_modules/.bin/' + (/^win/.test(process.platform) ? 'jsdoc.cmd' : 'jsdoc'),
          options: {
            verbose: true,
            destination: DOCS_PATH,
            configure: 'conf.json',
            tutorials: 'tutorials',
            template: './',
            'private': false,
            query: ''
          }
        },
      },

      sass: {
        dist: {
          src: 'sass/main.scss',
          dest: 'static/styles/main.css'
        }
      },

      copy: {
        dist: {
          files: [
            {
              expand: true,
              cwd: 'src',
              dest: 'generated',
              src: [
                'static/**'
              ],
            },
            {
              expand: true,
              cwd: 'node_modules/numbro',
              dest: 'generated/components/numbro',
              src: ['**'],
            },
            {
              expand: true,
              cwd: 'node_modules/axios',
              src: ['dist/axios.min.js'],
              dest: 'generated/components/axios/',
            },
            {
              expand: true,
              cwd: 'node_modules/fastclick',
              src: ['lib/fastclick.js'],
              dest: 'generated/components/fastclick/',
            },
            {
              expand: true,
              cwd: 'node_modules/handsontable-pro',
              src: ['dist/handsontable.*', 'dist/languages/*.js'],
              dest: 'generated/components/handsontable-pro/',
            },
            // Not used in the documentation at all but used by developers who using our server as a CDN (legacy support)
            {
              expand: true,
              cwd: 'node_modules/handsontable',
              src: ['dist/handsontable.*', 'dist/languages/*.js'],
              dest: 'generated/components/handsontable/',
            },
            {
              expand: true,
              cwd: 'node_modules/font-awesome',
              src: ['css/**', 'fonts/**'],
              dest: 'generated/components/font-awesome/',
            },
            {
              expand: true,
              cwd: 'node_modules/highlightjs',
              dest: 'generated/components/highlightjs',
              src: ['**'],
            },
            {
              expand: true,
              cwd: 'node_modules/promise-polyfill',
              src: ['dist/polyfill.min.js'],
              dest: 'generated/components/promise-polyfill/',
            },
            {
              expand: true,
              cwd: 'node_modules/details-element-polyfill',
              src: ['dist/details-element-polyfill.js'],
              dest: 'generated/components/details-element-polyfill/',
            },
          ]
        }
      },

      watch: {
        tutorials: {
          files: ['tutorials/**'],
          tasks: ['build-tutorials'],
          options: {
            debounceDelay: 250
          },
        },
        templates: {
          files: ['tmpl/**'],
          tasks: ['build-docs'],
          options: {
            debounceDelay: 250
          },
        },
        sass: {
          files: ['sass/**'],
          tasks: ['sass'],
          options: {
            debounceDelay: 250
          },
        },
        static: {
          files: ['static/**'],
          tasks: ['copy'],
          options: {
            debounceDelay: 250
          },
        }
      },

      sitemap: {
        dist: {
          pattern: ['generated/*.html', '!generated/tutorial-40*.html'],
          siteRoot: 'generated/'
        }
      },

      gitclone: {
        handsontable: {
          options: {
            branch: HOT_DEFAULT_BRANCH,
            repository: HOT_REPO,
            directory: HOT_SRC_PATH,
            verbose: true
          }
        },
      },

      env: {
        build: {
          src: '.env.json'
        }
      }
    });

    grunt.registerTask('default', ['env:build', 'authenticate-git', 'update-hot', 'generate-docs']);
    grunt.registerTask('build', ['env:build', 'authenticate-git', 'build-docs']);

    grunt.registerTask('authenticate-git', 'Authenticate Github', function() {
      gitHelper.setupGitApi(process.env.GITHUB_TOKEN);
    });

    grunt.registerTask('update-hot', 'Update Handsontable repository', function() {
      var hotBranch = getHotBranch();

      grunt.log.write('Cloning Handsontable v.' + hotBranch);
      grunt.config.set('gitclone.handsontable.options.branch', hotBranch);

      grunt.task.run('clean:source');
      grunt.task.run('gitclone:handsontable');
    });

    grunt.registerTask('generate-docs', 'Generate the documentation', function() {
      var timer;
      var done = this.async();

      timer = setInterval(function() {
        if (!grunt.file.isFile(HOT_SRC_PATH + '/package.json')) {
            return;
        }

        clearInterval(timer);
        grunt.task.run('build');
        grunt.task.run('generate-doc-versions');
        grunt.task.run('generate-disallow-for-robots');
        done();
      }, 50);
    });

    grunt.registerTask('generate-doc-versions', 'Generate version list for Handsontable', function() {
      var done = this.async();

      gitHelper.getDocsVersions().then(function(branches) {
        branches = branches.filter(function(branch) {
          return /^\d+\.\d+\.\d+$/.test(branch) && !/^draft\-/.test(branch) && semver.gte(branch, '1.14.0');
        }).map(function(branch) {
          return HOT_EQUIVALENT_VERSIONS.has(branch) ? [branch, HOT_EQUIVALENT_VERSIONS.get(branch)] : branch;
        });

        var content = 'docVersions && docVersions(' + JSON.stringify(branches.reverse()) + ')';

        grunt.log.write('The following versions found: ' + branches.join(', '));
        fs.writeFile(path.join(DOCS_PATH, 'scripts', 'doc-versions.js'), content, done);
      });
    });

    grunt.registerTask('generate-disallow-for-robots', 'Generate disallowed paths for web crawler robots', function () {
      var done = this.async();

      gitHelper.getDocsVersions().then(function(branches) {
        branches.pop(); // Remove the newest version of the docs

        var content = '\n' + branches.map(function(branch) {
          return 'Disallow: /docs/' + branch + '/';
        }).join('\n') + '\n\n';

        grunt.log.write('The following versions added to disallow: ' + branches.join(', '));
        fs.writeFile(path.join(DOCS_PATH, 'robots_disallow'), content, done);
      });
    });

    grunt.registerTask('build-docs', 'Generate the documentation', function() {
      var done = this.async();
      var hotPackage;

      if (argv['hot-version']) {
        var isDraftNext = argv['hot-version'] === 'next';
        var version = isDraftNext ? 'next' : getHotBranch();

        grunt.config.set('jsdoc.prod.options.query', querystring.stringify({
          version: version,
          latestVersion: version,
        }));

        grunt.task.run('sass', 'copy', 'jsdoc:prod', 'sitemap');
        done();

      } else {
        gitHelper.getHotLatestRelease().then(function(info) {
          hotPackage = grunt.file.readJSON(HOT_SRC_PATH + '/package.json');

          grunt.config.set('jsdoc.prod.options.query', querystring.stringify({
            version: hotPackage.version,
            latestVersion: info.name
          }));

          grunt.task.run('sass', 'copy', 'jsdoc:prod', 'sitemap');
          done();
        });
      }
    });

    grunt.registerTask('build-tutorials', 'Generate only tutorials', function() {
      var done = this.async();
      var hotPackage;

      if (argv['hot-version']) {
        var isDraftNext = argv['hot-version'] === 'next';
        var version = isDraftNext ? 'next' : getHotBranch();

        grunt.config.set('jsdoc.only_tutorials.options.query', querystring.stringify({ version: version, latestVersion: version, }));

        grunt.task.run('jsdoc:only_tutorials');
        done();

      } else {
        gitHelper.getHotLatestRelease().then(function(info) {
          hotPackage = grunt.file.readJSON(HOT_SRC_PATH + '/package.json');
          grunt.config.set('jsdoc.only_tutorials.options.query', querystring.stringify({
              version: hotPackage.version,
              latestVersion: info.name
          }));

          grunt.task.run('jsdoc:only_tutorials');
          done();
        });
      }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-git');
    grunt.loadNpmTasks('grunt-jsdoc');
    grunt.loadNpmTasks('grunt-sitemap');
    grunt.loadNpmTasks('grunt-env');
};
