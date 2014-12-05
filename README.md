Flashlight
==========

A pluggable integration with ElasticSearch to provide advanced content searches in Firebase.

This script can:
 - monitor multiple Firebase paths and index data in real time
 - communicates with client completely via Firebase (client pushes search terms to `search/request` and reads results from `search/result`)
 - clean up old, outdated requests

Getting Started
===============

 - Install and run [ElasticSearch](http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/setup.html) or add [Bonsai service](https://addons.heroku.com/bonsai#starter) via Heroku
 - `git clone https://github.com/firebase/flashlight`
 - `npm install`
 - edit config.js (see comments at the top, you must set FB_URL at a minimum)
 - `node app.js` (run the app)

Check out the recommended security rules in example/seed/security_rules.json.
See example/README.md to seed and run an example client app.

If you experience errors like `{"error":"IndexMissingException[[firebase] missing]","status":404}`, you may need
to manually create the index referenced in each path:

    curl -X POST http://localhost:9200/firebase

Client Implementations
======================

Read `example/index.html` and `example/example.js` for a client implementation. It works like this:

 - Push an object to `/search/request` which has the following keys: `index`, `type`, and `query`
 - Listen on `/search/response` for the reply from the server

The query object can be any valid ElasticSearch DSL structure (see More on Queries).

More on Queries
---------------

Check out [this great tutorial](http://okfnlabs.org/blog/2013/07/01/elasticsearch-query-tutorial.html) on querying ElasticSearch. And be sure to read the [ElasticSearch API Reference](http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/).

Deploy to Heroku
================

 - `cd flashlight`
 - `heroku login`
 - `heroku create` (add heroku to project)
 - `heroku addons:add bonsai` (install bonsai)
 - `heroku config`  (check bonsai instance info and copy your new BONSAI_URL - you will need it later)
 - `heroku config:set FB_NAME=<instance> FB_TOKEN="<token>"` (declare environment variables)
 - `git add conig.js` (update)
 - `git commit -m "configure bonsai"`
 - `git push heroku master` (deploy to heroku)
 - `heroku ps:scale worker=1` (start dyno worker)

### Setup Initial Index with Bonsai

After you've deployed to Heroku, you need to create your initial index name to prevent IndexMissingException error from Bonsai. Create an index called "firebase" via curl using the BONSAI_URL that you copied during Heroku deployment.

 - `curl -X POST <BONSAI_URL>/firebase` (ex: https://user:pass@yourbonsai.bonsai.io/firebase)

Support
=======

Submit questions or bugs using the [issue tracker](https://github.com/firebase/flashlight).

For Firebase-releated questions, try the [mailing list](https://groups.google.com/forum/#!forum/firebase-talk).

License
=======

[MIT LICENSE](http://firebase.mit-license.org/)
Copyright © 2013 Firebase <opensource@firebase.com>
