var S = require('string');

/** Paths to Monitor
 *
 * Each path can have these keys:
 * {string}   path:    [required] the Firebase path to be monitored, for example, `users/profiles`
 *                     would monitor https://<instance>.firebaseio.com/users/profiles
 * {string}   index:   [required] the name of the ES index to write data into
 * {string}   type:    [required] name of the ES object type this document will be stored as
 * {Array}    fields:  list of fields to be monitored and indexed (defaults to all fields, ignored if "parser" 
 *                     is specified)
 * {Array}    omit:    list of fields that should not be indexed in ES (ignored if "parser" is specified)
 * {Function} filter:  if provided, only records that return true are indexed
 * {Function} parser:  if provided, the results of this function are passed to ES, rather than the raw data 
 *                     (fields is ignored if this is used)
 * {object}   nested:  if provided, the type is assumed to be nested in another mapping in the index.  
 *                     must have subkeys:
 *  - {string} parentType: mapping to nest this mapping beneath
 *  - {string} parentField: name of the field within parent doc that nesting is stored under
 *  - {string} childIdField: "primary key" of nested documents, used to faciliatate "upsert" operation.
 ****************************************************/

exports.paths = [
  {
    path:  'users',
    index: 'firebase',
    type:  'users',
    omit: ['email', 'emailSettings', 'welcomeEmailSent', 'bookmarks', 'upvotes']
  },
  {  
    path:  'annotations',
    index: 'firebase',
    type:  'annotations'
  },
  { 
    path:  'communities',
    index: 'firebase',
    type:  'communities',
    omit: ['featuredFollowers', 'followers']
  },
  {
    path:  'posts',
    index: 'firebase',
    type:  'posts',
    omit: ['feeds', 'users']
  },
  {
    path: 'links',
    index: 'firebase',
    type: 'links',
    fields: ['content', 'description', 'created', 'originalUrl', 'providerDisplay',
             'providerName', 'providerUrl', 'title', 'type', 'url']
  },
  {
    path: 'wecite',
    index: 'casetext',
    type: 'wecites',
    nested: { 
      parentType: 'document', 
      parentField: 'wecites',
      childIdField: 'destinationDocId'
    },
    parser: function(data) {
      return Object.keys(data).map( function(d) {
        var retval = data[d];
        if (retval.edits) {
          delete retval.edits;
        }

        retval.destinationDocId = d;
        retval.description = retval.description ? S(retval.description).stripTags().s : null;
        
        return retval;
      });
    }
  }
];
