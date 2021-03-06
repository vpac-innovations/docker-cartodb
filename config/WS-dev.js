var config = {
     environment: 'development'
    ,port: 8181
    ,host: '0.0.0.0'
    ,uv_threadpool_size: undefined
    // Regular expression pattern to extract username
    // from hostname. Must have a single grabbing block.
    ,user_from_host: '^([^\\.]+)\\.'

    // Base URLs for the APIs
    //
    // See http://github.com/CartoDB/Windshaft-cartodb/wiki/Unified-Map-API
    // 
    // Base url for the Templated Maps API
    // "/api/v1/map/named" is the new API,
    // "/tiles/template" is for compatibility with versions up to 1.6.x
    ,base_url_templated: '(?:/api/v1/map/named|/user/:user/api/v1/map/named|/tiles/template)'
    // Base url for the Detached Maps API
    // "maps" is the the new API,
    // "tiles/layergroup" is for compatibility with versions up to 1.6.x
    ,base_url_detached: '(?:/api/v1/map|/user/:user/api/v1/map|/tiles/layergroup)'

    // Maximum number of connections for one process
    // 128 is a good value with a limit of 1024 open file descriptors
    ,maxConnections:128
    // Maximum number of templates per user. Unlimited by default.
    ,maxUserTemplates:1024
    // Seconds since "last creation" before a detached
    // or template instance map expires. Or: how long do you want
    // to be able to navigate the map without a reload ?
    // Defaults to 7200 (2 hours)
    ,mapConfigTTL: 7200
    // idle socket timeout, in milliseconds 
    ,socket_timeout: 600000
    ,enable_cors: true
    ,cache_enabled: false
    ,log_format: ':req[X-Real-IP] :method :req[Host]:url :status :response-time ms -> :res[Content-Type] (:res[X-Tiler-Profiler])'
    // If log_filename is given logs will be written
    // there, in append mode. Otherwise stdout is used (default).
    // Log file will be re-opened on receiving the HUP signal
    ,log_filename: 'logs/node-windshaft.log'
    // Templated database username for authorized user
    // Supported labels: 'user_id' (read from redis)
    ,postgres_auth_user: 'development_cartodb_user_<%= user_id %>'
    // Templated database password for authorized user
    // Supported labels: 'user_id', 'user_password' (both read from redis)
    ,postgres_auth_pass: '<%= user_password %>'
    ,postgres: {
        // Parameters to pass to datasource plugin of mapnik
        // See http://github.com/mapnik/mapnik/wiki/PostGIS
        type: "postgis",
        user: "publicuser",
        password: "public",
        host: 'postgres',
        port: 5432,
        extent: "-20037508.3,-20037508.3,20037508.3,20037508.3",
        /* experimental
        geometry_field: "the_geom",
        extent: "-180,-90,180,90",
        srid: 4326,
        */
        row_limit: 65535,
        simplify_geometries: true,
        use_overviews: true, // use overviews to retrieve raster
        /*
         * Set persist_connection to false if you want
         * database connections to be closed on renderer
         * expiration (1 minute after last use).
         * Setting to true (the default) would never
         * close any connection for the server's lifetime
         */
        persist_connection: false,
        max_size: 500
    }
    ,mapnik_version: undefined
    ,mapnik_tile_format: 'png8:m=h'
    ,statsd: {
        host: 'localhost',
        port: 8125,
        prefix: 'dev.',
        cacheDns: true
        // support all allowed node-statsd options
    }
    ,renderer: {
      // Milliseconds since last access before renderer cache item expires
      cache_ttl: 60000,
      statsInterval: 5000, // milliseconds between each report to statsd about number of renderers and mapnik pool status
      mapnik: {
          // The size of the pool of internal mapnik renderers
          // Check the configuration of uv_threadpool_size to use suitable value
          poolSize: 8,

          // Metatile is the number of tiles-per-side that are going
          // to be rendered at once. If all of them will be requested
          // we'd have saved time. If only one will be used, we'd have
          // wasted time.
          metatile: 2,

          // Buffer size is the tickness in pixel of a buffer
          // around the rendered (meta?)tile.
          //
          // This is important for labels and other marker that overlap tile boundaries.
          // Setting to 128 ensures no render artifacts.
          // 64 may have artifacts but is faster.
          // Less important if we can turn metatiling on.
          bufferSize: 64,

          // SQL queries will be wrapped with ST_SnapToGrid
          // Snapping all points of the  geometry to a regular grid
          snapToGrid: false,

          // SQL queries will be wrapped with ST_ClipByBox2D
          // Returning the portion of a geometry falling within a rectangle
          // It will only work if snapToGrid is enabled
          clipByBox2d: false, // this requires postgis >=2.2 and geos >=3.5

          limits: {
              // Time in milliseconds a render request can take before it fails, some notes:
              //  - 0 means no render limit
              //  - it considers metatiling, naive implementation: (render timeout) * (number of tiles in metatile)
              render: 0,
              // As the render request will finish even if timed out, whether it should be placed in the internal
              // cache or it should be fully discarded. When placed in the internal cache another attempt to retrieve
              // the same tile will result in an immediate response, however that will use a lot of more application
              // memory. If we want to enforce this behaviour we have to implement a cache eviction policy for the
              // internal cache.
              cacheOnTimeout: true
          }
      },
      http: {
          timeout: 2000, // the timeout in ms for a http tile request
          proxy: undefined, // the url for a proxy server
          whitelist: [ // the whitelist of urlTemplates that can be used
              '.*', // will enable any URL
              'http://{s}.example.com/{z}/{x}/{y}.png'
          ],
          // image to use as placeholder when urlTemplate is not in the whitelist
          // if provided the http renderer will use it instead of throw an error
          fallbackImage: {
              type: 'fs', // 'fs' and 'url' supported
              src: __dirname + '/../../assets/default-placeholder.png'
          }
      }
    }
    ,millstone: {
        // Needs to be writable by server user
        cache_basedir: '/tmp/cdb-tiler-dev/millstone-dev'
    }
    ,redis: {
        host: 'postgres',
        port: 6379,
        // Max number of connections in each pool.
        // Users will be put on a queue when the limit is hit.
        // Set to maxConnection to have no possible queues.
        // There are currently 2 pools involved in serving
        // windshaft-cartodb requests so multiply this number
        // by 2 to know how many possible connections will be
        // kept open by the server. The default is 50.
        max: 50,
        returnToHead: true, // defines the behaviour of the pool: false => queue, true => stack
        idleTimeoutMillis: 1, // idle time before dropping connection
        reapIntervalMillis: 1, // time between cleanups
        slowQueries: {
            log: true,
            elapsedThreshold: 200
        },
        slowPool: {
            log: true, // whether a slow acquire must be logged or not
            elapsedThreshold: 25 // the threshold to determine an slow acquire must be reported or not
        },
        emitter: {
            statusInterval: 5000 // time, in ms, between each status report is emitted from the pool, status is sent to statsd
        }
    }
    ,varnish: {
        host: 'localhost',
        port: 6082, // the por for the telnet interface where varnish is listening to
        http_port: 6081, // the port for the HTTP interface where varnish is listening to
        purge_enabled: false, // whether the purge/invalidation mechanism is enabled in varnish or not
        secret: 'xxx',
        ttl: 86400,
        layergroupTtl: 86400 // the max-age for cache-control header in layergroup responses
    }
    // this [OPTIONAL] configuration enables invalidating by surrogate key in fastly
    ,fastly: {
        // whether the invalidation is enabled or not
        enabled: false,
        // the fastly api key
        apiKey: 'wadus_api_key',
        // the service that will get surrogate key invalidation
        serviceId: 'wadus_service_id'
    }
    // If useProfiler is true every response will be served with an
    // X-Tiler-Profile header containing elapsed timing for various 
    // steps taken for producing the response.
    ,useProfiler:true
    // Settings for the health check available at /health
    ,health: {
      enabled: false,
      username: 'localhost',
      z: 0,
      x: 0,
      y: 0
    }
    ,disabled_file: 'pids/disabled'

    // Use this as a feature flags enabling/disabling mechanism
    ,enabledFeatures: {
        // whether it should intercept tile render errors an act based on them, enabled by default.
        onTileErrorStrategy: true,
        // whether the affected tables for a given SQL must query directly postgresql or use the SQL API
        cdbQueryTablesFromPostgres: true
    }
};

module.exports = config;
