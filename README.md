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
 - edit config.js (see comments at the top, you must set FB_URL and FB_SERVICEACCOUNT at a minimum)
 - `node app.js` (run the app)

Check out the recommended security rules in example/seed/security_rules.json.
See example/README.md to seed and run an example client app.

If you experience errors like `{"error":"IndexMissingException[[firebase] missing]","status":404}`, you may need
to manually create the index referenced in each path:

    curl -X POST http://localhost:9200/firebase

To read more about setting up a Firebase service account and configuring FB_SERVICEACCOUNT, [click here](https://firebase.google.com/docs/database/server/start).

Client Implementations
======================

Read `example/index.html` and `example/example.js` for a client implementation. It works like this:

 - Push an object to `/search/request` which has the following keys: `index`, `type`, and `q` (or `body` for advanced queries)
 - Listen on `/search/response` for the reply from the server

The `body` object can be any valid ElasticSearch DSL structure (see More on Queries).

Deploy to Heroku
================

 - `cd flashlight`
 - `heroku login`
 - `heroku create` (add heroku to project)
 - `heroku addons:add bonsai` (install bonsai)
 - `heroku config`  (check bonsai instance info and copy your new BONSAI_URL - you will need it later)
 - `heroku config:set FB_NAME=<instance> FB_TOKEN="<token>"` (declare environment variables)
 - `git add config.js` (update)
 - `git commit -m "configure bonsai"`
 - `git push heroku master` (deploy to heroku)
 - `heroku ps:scale worker=1` (start dyno worker)

### Setup Initial Index with Bonsai

After you've deployed to Heroku, you need to create your initial index name to prevent IndexMissingException error from Bonsai. Create an index called "firebase" via curl using the BONSAI_URL that you copied during Heroku deployment.

 - `curl -X POST <BONSAI_URL>/firebase` (ex: https://user:pass@yourbonsai.bonsai.io/firebase)
 
Advanced Topics
===============
 
Parsing and filtering indexed data
----------------------------------
The `paths` specified in `config.js` can include the special `filter`
and `parse` functions to manipulate the contents of the index. For
example, if I had a messaging app, but I didn't want to index any
system-generated messages, I could add the following filter to my
messages path:

```
filter: function(data) { return data.name !== 'system'; }
```

Here, data represents the JSON snapshot obtained from the database. If
this method does not return true, that record will not be indexed. Note
that the `filter` method is applied before `parse`.

If I want to remove or alter data getting indexed, that is done using the
`parse` function. For example, assume I wanted to index user records, but
 remove any private information from the index. I could add a parse
 function to do this:
 
```
parse: function(data) {
   return {
      first_name: data.first_name,
      last_name: data.last_name,
      birthday: new Date(data.birthday_as_number).toISOString()
   };
}
```

Building ElasticSearch Queries
------------------------------
 
 The full ElasticSearch API is supported. Check out [this great tutorial](http://okfnlabs.org/blog/2013/07/01/elasticsearch-query-tutorial.html) on querying ElasticSearch. And be sure to read the [ElasticSearch API Reference](http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/).
 
### Example: Simple text search

```
 {
   "q": "foo*"
 }
```
 
### Example: Paginate
 
You can control the number of matches (defaults to 10) and initial offset for paginating search results:

```
 {
   "from" : 0, 
   "size" : 50, 
   "body": {
     "query": {
        "match": {
           "_all": "foo"
        }
     }
   }
 }; 
```
 
#### Example: Search for multiple tags or categories
 
```
 {
   "body": {
     "query": {
       { "tag": [ "foo", "bar" ] }
     }
   }
 }
```
 
[read more](https://www.elastic.co/guide/en/elasticsearch/guide/current/complex-core-fields.html)

### Example: Search only specific fields
```
 {
   "body": {
     "query": {
       "match": {
         "field":  "foo",
       }
     }
   }
 }
```
 
### Example: Give more weight to specific fields
```
 {
   "body": {
     "query": {
       "multi_match": {
         "query":  "foo",
         "type":   "most_fields", 
         "fields": [ 
            "important_field^10", // adding ^10 makes this field relatively more important 
            "trivial_field" 
         ]
       }
     }
   }
 }
```

[read more](https://www.elastic.co/guide/en/elasticsearch/guide/current/most-fields.html)

#### Helpful section of ES docs
 
 [Search lite (simple text searches with `q`)](https://www.elastic.co/guide/en/elasticsearch/guide/current/search-lite.html)
 [Finding exact values](https://www.elastic.co/guide/en/elasticsearch/guide/current/_finding_exact_values.html)
 [Sorting and relevance](https://www.elastic.co/guide/en/elasticsearch/guide/current/sorting.html)
 [Partial matching](https://www.elastic.co/guide/en/elasticsearch/guide/current/partial-matching.html)
 [Wildcards and regexp](https://www.elastic.co/guide/en/elasticsearch/guide/current/_wildcard_and_regexp_queries.html)
 [Proximity matching](https://www.elastic.co/guide/en/elasticsearch/guide/current/proximity-matching.html)
 [Dealing with human language](https://www.elastic.co/guide/en/elasticsearch/guide/current/languages.html)

Operating at massive scale
--------------------------
Is Flashlight designed to work at millions or requests per second? 
No. It's designed to be a template for implementing your production services. 
Some assembly required.

Here are a couple quick optimizations you can make to improve scale:
 * Separate the indexing worker and the query worker (this could be
   as simple as creating two Flashlight workers, opening `app.js` in each,
   and commenting out SearchQueue.init() or PathMonitor.process() respectively.
 * When your service restarts, all data is re-indexed. To prevent this,
   you can use pathBuilder as described in the next section.
 * With a bit of work, both PathMonitor and SearchQueue could be adapted 
   to function as a Service Worker for 
   [firebase-queue](https://github.com/firebase/firebase-queue),    
   allowing multiple workers and potentially hundreds of thousands of 
   writes per second (with minor degredation and no losses at even higher throughput).

Use refBuilder to improve indexing efficiency
---------------------------------------------
In `config.js`, each entry in `paths` can be assigned a `pathBuilder`
function. This can construct a query for determining which records
get indexed. 

This can be utilized to improve efficiency by preventing all data from
being re-indexed any time the Flashlight service is restarted, and generally
by preventing a large backlog from being read into memory at once.

For example, if I were indexing chat messages, and they
had a timestamp field, I could use the following to never look back
more than a day during a server restart:

```
exports.paths = [
   {
      path  : "chat/messages",
      index : "firebase",
      type  : "message",
      fields: ['message_body', 'tags'],
      pathBuilder: function(ref, path) {
         return ref.orderByChild('timestamp').startAt(Date.now());
      }
   }
];
```

Loading paths to index from the database instead of config file
---------------------------------------------------------------

Paths to be indexed can be loaded dynamically from the database by
providing a path string instead of the `paths` array. For example,
the paths given in config.example.js could be replaced with `dynamic_paths`
and then those paths could be stored in the database, similar to 
[this](https://kato-flashlight-dev.firebaseio.com/dynamic_paths.json?print=pretty).

Any updates to the database paths are handled by Flashlight (new paths are
indexed when they are added, old paths stop being indexed when they
are removed).

Unfortunately, since JSON data stored in Firebase can't contain functions,
the `filter`, `parser`, and `refBuilder` options can't be used with this
approach.

Support
=======
Submit questions or bugs using the [issue tracker](https://github.com/firebase/flashlight).

For Firebase-releated questions, try the [mailing list](https://groups.google.com/forum/#!forum/firebase-talk).

License
=======

[MIT LICENSE](http://firebase.mit-license.org/)
Copyright © 2013 Firebase <opensource@firebase.com>
