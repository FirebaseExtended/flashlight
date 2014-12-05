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
 *
 * To store your paths dynamically, rather than specifying them all here, you can store them in Firebase.
 * Format each path object with the same keys described above, and store the array of paths at whatever
 * location you specified in the PATHS_CONFIG variable. Be sure to restrict that data in your Security Rules.
 ****************************************************/

exports.paths = [
  {
    path: "users",
    index: "firebase",
    type: "user"
  },
  {
    path: "messages",
    index: "firebase",
    type: "message",
    fields: ['msg', 'name'],
    filter: function(data) { return data.name !== 'system'; }
  }
];
