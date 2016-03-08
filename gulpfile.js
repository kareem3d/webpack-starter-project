var gulp = require('gulp');
var MemoryFS = require("memory-fs");
var webpack = require('webpack');
var path = require('path');
var fs = require('fs');
var DeepMerge = require('deep-merge');
var webpackDevMiddleware = require('webpack-dev-middleware')
var webpackHotMiddleware = require('webpack-hot-middleware')
var Express = require('express');
var frontendConfig = require('./webpack.frontend.js');
var backendConfig = require('./webpack.backend.js');
var enableDestroy = require('server-destroy');

function initServerBuildFile() {
  var dir = './build';

  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
  }
  
  fs.writeFileSync(dir + "/backend.js", "require('mongoose')");
}

function onBuild(done) {
  return function(err, stats) {
    if(err) {
      console.log('Error', err);
    }
    else {
      console.log(stats.toString());
    }

    if(done) {
      done();
    }
  }
}

function createHotReloadMiddlewares() {
  var compiler = webpack(frontendConfig);

  return [
    webpackDevMiddleware(compiler, { 
      noInfo: true, 
      publicPath: frontendConfig.output.publicPath }),
    webpackHotMiddleware(compiler)
  ];
}

function watchBackend(middlewares, done) {

  initServerBuildFile();
  requireServer([]);
  
  var httpServer = null;

  webpack(backendConfig).watch(500, function(err, stats) {
    if(!httpServer) {
      httpServer = requireServer(middlewares);
      done();
    } else {
      httpServer.destroy(function() {
        httpServer = requireServer(middlewares);
        console.log("Server destroyed");
      });
    }
  });
}

function cleanRequire(p) {
  delete require.cache[require.resolve(p)]
  return require(p);
}

function requireServer(middlewares) {
  var backendModule = cleanRequire('./build/backend');
  if(backendModule.backend && backendModule.backend.serve) {
    var server = backendModule.backend.serve(middlewares);
    enableDestroy(server);
    return server;
  }
}

function handleFatalError(err) {
  throw err;
}

function handleSoftErrors(err) {
  throw err;
}

function handleWarnings(warnings) {
  console.error(warnings);
}

gulp.task('frontend-build', function(done) {
  webpack(frontendConfig).run(onBuild(done));
});

gulp.task('frontend-watch', function(done) {
  webpack(frontendConfig).watch(1000, onBuild(done));
});

gulp.task('backend-build', function(done) {
  webpack(backendConfig).run(onBuild(done));
});

gulp.task('serve:backend', function(done) {
  watchBackend([], done);
})

/**
 * Serve with frontend hot reloading
 */
gulp.task('serve', ['frontend-watch'], function(done) {
  watchBackend([], done);
});

/**
 * Serve without hot reloading
 */
gulp.task('serve:freeze', ['frontend-watch', 'serve:backend']);

gulp.task('build', ['frontend-build', 'backend-build']);
