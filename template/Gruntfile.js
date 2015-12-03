module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);
  
  var jshint = {},
    csslint = {},
    mochacli = {},
    concurrent = {},
    nodemon = {},
    startTasks = [],
    concurrentTasks = [],
    testTasks = [],
    serverTasks = [],
    lintTasks  = []
  ;
  
  
  /* for Mocha test   */   
  mochacli.spec = {
    options: {
      require: [],   // add dependicies here
      reporter: 'spec',
      files: [],  // add files here
      ui: 'bdd',
      colors: true,
      timeout: '31000000'
    }
  }
  testTasks.push('mochacli:spec');
  /* for Mocha test end  */
  
  /* for JSHint start*/  
  jshint.target =  [ 
      // add target files here  
  ];
  
  jshint.options = {
    curly: true,
    eqeqeq: true,
    eqnull: true,
    esnext: true,
    browser: true,
    reporter: require('jshint-stylish'),
    globals: {
    jQuery: true
    }
  };
  
  lintTasks.push('jshint:target');    
  /* for JSHint end*/
  
  /* for csslint*/    
  csslint.styles = {
    src: 'client/public/css/**/*.css',      
    options: {
      csslintrc: '.csslintrc'
    }
  };
  
  lintTasks.push('csslint:styles');  
  /* for csslint end*/  

  /* for Bower  */    
  exec.bower= {
    command: 'bower install --allow-root'
  };  
  concurrent.bower = {
    tasks: ['exec:bower'],        
    options: {
      logConcurrentOutput: true
    }
  };
  /* for bower end */  
  
  /* for npm start and for monitoring the js files for change and restarting server*/

  nodemon.dev = {
    script: 'server/app.js',
    options: {
      ignore: [],
      ext: 'js',
      delay: 1000,
      watch:  ['server']
    }
  };
  concurrent.nodemon = {
    tasks: ['nodemon:dev'],        
    options: {
      logConcurrentOutput: true
    }
  };
  /* for  npm start end */  
  
  concurrent.tasks = {
    tasks: concurrentTasks,
    options: {
      logConcurrentOutput: true,
      limit: 10
    }
  };  
  concurrentTasks.push.apply(concurrentTasks, ['concurrent:bower', 'concurrent:nodemon']);
  startTasks.push('concurrent:tasks');  
  
  grunt.initConfig({
    jshint: jshint,
    csslint: csslint,
    nodemon: nodemon,
    mochacli: mochacli,
    concurrent: concurrent
  });           

  grunt.registerTask('default', startTasks);
  grunt.registerTask('test', testTasks);
  grunt.registerTask('start', startTasks);
  grunt.registerTask('lint', lintTasks);
  grunt.registerTask('js',  lintTasks[0]);  
  grunt.registerTask('css',  lintTasks[1]);
};
