/* jshint node: true */
'use strict';

var path = require('path');

module.exports = {
  name: 'ember-cli-raygun',

  isDevelopingAddon: function() {
    return true;
  },

  blueprintsPath: function() {
    return path.join(__dirname, 'blueprints');
  },

  contentFor: function(type, config) {
    var scripts = [];

    if (type === 'head-footer') {
      scripts.push('!function(a,b,c,d,e,f,g,h){a.RaygunObject=e,a[e]=a[e]||function(){(a[e].o=a[e].o||[]).push(arguments)},f=b.createElement(c),g=b.getElementsByTagName(c)[0],f.async=1,f.src=d,g.parentNode.insertBefore(f,g),h=a.onerror,a.onerror=function(b,c,d,f,g){h&&h(b,c,d,f,g),g||(g=new Error(b)),a[e].q=a[e].q||[],a[e].q.push({e:g})}}(window,document,"script","//cdn.raygun.io/raygun4js/raygun.min.js","rg4js");');
    }

    if (scripts.length > 0) {
      return '<script>' + scripts.join('') + '</script>';
    }
  }
};
