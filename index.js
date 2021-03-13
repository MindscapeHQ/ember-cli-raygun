'use strict';

const RAYGUN_LOADER = `<script type="text/javascript">
    !function(a,b,c,d,e,f,g,h){a.RaygunObject=e,a[e]=a[e]||function(){
    (a[e].o=a[e].o||[]).push(arguments)},f=b.createElement(c),g=b.getElementsByTagName(c)[0],
    f.async=1,f.src=d,g.parentNode.insertBefore(f,g),h=a.onerror,a.onerror=function(b,c,d,f,g){
    h&&h(b,c,d,f,g),g||(g=new Error(b)),a[e].q=a[e].q||[],a[e].q.push({
    e:g})}}(window,document,"script","//cdn.raygun.io/raygun4js/raygun.min.js","rg4js");
</script>`;

module.exports = {
  name: require('./package').name,
  options: {
    // see https://www.npmjs.com/package/@embroider/macros/v/0.4.1
    '@embroider/macros': {
      setOwnConfig: {
        // ... 
      },
    }
  },

  contentFor(type, config) {
    const raygunConfig = config['raygun'] || {}

    if (type === 'head' && raygunConfig['enableCrashReporting']) {
      return RAYGUN_LOADER;
    }
  },

  config(_, appConfig) {
    this.options['@embroider/macros'].setOwnConfig.raygunConfig = { ...appConfig.raygun };
    return this._super(...arguments);
  }
};
