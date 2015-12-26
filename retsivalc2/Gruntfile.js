module.exports = grunt => {

require('load-grunt-tasks')(grunt);

var exec = {}
 ,  concurrent = {}
 ,  nodemon = {}
 ,  startTasks = []
 ,  concurrentTasks = []
 ,  watch = {}
 ,  sass={}
 ,  jade={}
 ,  concat = {}
 ,  babel = {
      options:  {
        sourceMap: true,
        presets: ['es2015']
      }
    }
;

/* for jade to html  */    
jade.html= {
  expand: true,
  src: ['**/*.jade', '!layout.jade'], 
  cwd: 'client/jade',
  ext : '.html',
  dest: 'dist/html/'
};  
watch.jade = {
  tasks: ['jade:html'],
  files: 'client/jade/**'
};
startTasks.push('jade:html');
/* for jade to html end */  



/* Watch Grunt file*/
watch.grunt = {
  files: ['Gruntfile.js'],
  reload: true
};
/* Watch Grunt file end*/


/* for es6 to es5 */    
  var es6SrcFolder = 'client/js/',
    destES6 = 'dist/app.es6.js',
    destES5 = 'dist/app.js',
    es6SrcList = [
      'app.js',
      'factory.js',
      'filter.js',
      'controller.js',
      'directive.js',
      'modal.js',
      'model.js'
    ],
    es6Files = {}, 
    es6to5Files = {};
  es6to5Files[destES5] = destES6;
  
  es6Files[destES6] = es6SrcList.map(v=> es6SrcFolder + v);
  concat.es6 = { files: es6Files };
  babel.es6 = { files: es6to5Files};
  var es6Tasks = ['concat:es6', 'babel:es6'];
  startTasks.push.apply(startTasks, es6Tasks);
  watch.es6 =  {
                files: es6SrcFolder + '**',
                tasks: es6Tasks
  };  
/* for es6 to es5 */  



/* for Bower  */    
exec.bower= {
  command: 'bower install --allow-root'
};  
concurrent.bower = {
  tasks: ['exec:bower']
};
/* for bower end */  

/* for npm start and for monitoring the js files for change and restarting server*/

nodemon.dev = {
  script: 'app.js',
  options: {
    ignore: [],
    ext: 'js',
    delay: 1000,
    watch:  ['app.js'],
    sourcemap: 'none'
  }
};
concurrent.nodemon = {
  tasks: ['nodemon:dev']
};
/* for  npm start end */  

/* for sass */

sass.scss = {  
  files: [{
    expand: true,
    cwd: 'client/scss',
    src: ['*.scss'],
    dest: 'dist/css',
    ext: '.css'
  }]
};
watch.scss = {
  files: 'client/scss/*.scss',
  tasks: ['sass:scss']
};
startTasks.push('sass:scss');
/* for sass end*/

/* Live reload*/

watch.reload = {
  files: 'dist/**',
  options: {livereload: true}
};
/*Live reload end*/



concurrentTasks.push.apply(concurrentTasks, ['concurrent:bower', 'concurrent:nodemon']);
watchAll = Object.keys(watch).map(v => 'watch:'+v); 
concurrentTasks.push.apply(concurrentTasks, watchAll); 
startTasks.push('concurrent:tasks');  

concurrent.tasks = {
  tasks: concurrentTasks,
  options: {
    logConcurrentOutput: true,
    limit: 31
  }
};    
grunt.initConfig({
  nodemon,
  concurrent,
  watch,
  sass,
  babel,
  concat,
  exec,
  jade
});           

grunt.registerTask('default', startTasks);
grunt.registerTask('dev', startTasks);

};
