/* example.js
 *************************************/
(function ($) {
   "use strict";

   /**====== SET ME =====**/
   /**====== SET ME =====**/
   /**====== SET ME =====**/
   var URL = 'https://INSTANCE.firebaseio.com';

   // handle form submits
   $('form').on('submit', function(e) {
      e.preventDefault();
      var $form = $(this);
      var term = $form.find('[name="term"]').val();
      var words = $form.find('[name="words"]').is(':checked');
      if( term ) {
         doSearch($form.find('[name="index"]').val(), $form.find('[name="type"]:checked').val(), buildQuery(term, words));
      }
      else {
         $('#results').text('');
      }
   });

   // display search results
   function doSearch(index, type, query) {
      var ref = new Firebase(URL+'/search');
      var key = ref.child('request').push({ index: index, type: type, query: query }).key();
      console.log('search', key, { index: index, type: type, query: query });
      ref.child('response/'+key).on('value', showResults);
   }

   function showResults(snap) {
      if( !snap.exists() ) { return; } // wait until we get data
      var dat = snap.val();
      snap.ref().off('value');
      snap.ref().remove();
      var $pair = $('#results')
         .text(JSON.stringify(dat, null, 2))
         .add( $('#total').text(dat.total) )
         .removeClass('error zero');
      if( dat.error ) {
         $pair.addClass('error');
      }
      else if( dat.total < 1 ) {
         $pair.addClass('zero');
      }
   }

   function buildQuery(term, words) {
      // See this tut for more query options:
      // http://okfnlabs.org/blog/2013/07/01/elasticsearch-query-tutorial.html#match-all--find-everything
      return {
         'query_string': { query: makeTerm(term, words) }
      };
   }

   function makeTerm(term, matchWholeWords) {
      if( !matchWholeWords ) {
         if( !term.match(/^\*/) ) { term = '*'+term; }
         if( !term.match(/\*$/) ) { term += '*'; }
      }
      return term;
   }

   // display raw data for reference
   new Firebase(URL).on('value', setRawData);
   function setRawData(snap) {
      $('#raw').text(JSON.stringify(snap.val(), null, 2));
   }
})(jQuery);
