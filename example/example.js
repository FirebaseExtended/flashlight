(function ($) {
	"use strict";

<<<<<<< HEAD
	/**====== SET ME =====**/
	/**====== SET ME =====**/
	/**====== SET ME =====**/
	// Set the configuration for your app
	// TODO: Replace with your project's config object
	var config = {
		apiKey: "AIzaSyChDcCpz7oeivzeiTRLmPTH7iAOVY-RaSE",
		authDomain: "webcharts-dev.firebaseapp.com",
		databaseURL: "https://webcharts-dev.firebaseio.com",
		storageBucket: "webcharts-dev.appspot.com",
		messagingSenderId: "559862339530"
	};
=======
  /**====== SET ME =====**/
  /**====== SET ME =====**/
  /**====== SET ME =====**/
  // Set the configuration for your app
  // TODO: Replace with your project's config object
  var config = {
    databaseURL: "https://kato-flashlight.firebaseio.com"
  };
>>>>>>> firebase/master

	// TODO: Replace this with the path to your ElasticSearch queue
	// TODO: This is monitored by your app.js node script on the server
	// TODO: And this should match your seed/security_rules.json
	var PATH = "search";
	/**====== /SET ME =====**/
	/**====== /SET ME =====**/
	/**====== /SET ME =====**/

	// Initialize connection using our project credentials
	firebase.initializeApp(config);

	// Get a reference to the database service
	var database = firebase.database();

<<<<<<< HEAD
	// handle form submits
	$('form')
		.on('submit', function (e) {
			e.preventDefault();
			var $form = $(this);
			var term = $form.find('[name="term"]')
				.val();
			var words = $form.find('[name="words"]')
				.is(':checked');
			if (term) {
				doSearch($form.find('[name="index"]')
					.val(), $form.find('[name="type"]:checked')
					.val(), makeTerm(term, words));
			} else {
				$('#results')
					.text('');
			}
		});

	// display search results
	function doSearch(index, type, query) {
		var ref = database.ref()
			.child(PATH);
		var key = ref.child('request')
			.push({
				index: index,
				type: type,
				query: query
			})
			.key;

		console.log('search', key, {
			index: index,
			type: type,
			query: query
		});
		ref.child('response/' + key)
			.on('value', showResults);
	}

	function showResults(snap) {
		if (!snap.exists()) {
			return;
		} // wait until we get data
		var dat = snap.val();
		snap.ref.off('value', showResults);
		snap.ref.remove();
		var $pair = $('#results')
			.text(JSON.stringify(dat, null, 2))
			.add($('#total')
				.text(dat.total))
			.removeClass('error zero');
		if (dat.error) {
			$pair.addClass('error');
		} else if (dat.total < 1) {
			$pair.addClass('zero');
		}
	}

	function makeTerm(term, matchWholeWords) {
		if (!matchWholeWords) {
			if (!term.match(/^\*/)) {
				term = '*' + term;
			}
			if (!term.match(/\*$/)) {
				term += '*';
			}
		}
		return term;
	}

	// display raw data for reference
	database.ref()
		.on('value', setRawData);

	function setRawData(snap) {
		$('#raw')
			.text(JSON.stringify(snap.val(), null, 2));
	}
=======
  // handle form submits and conduct a search
  // this is mostly DOM manipulation and not very
  // interesting; you're probably interested in
  // doSearch() and buildQuery()
  $('form').on('submit', function(e) {
    e.preventDefault();
    var $form = $(this);
    $('#results').text('');
    $('#total').text('');
    $('#query').text('');
    if( $form.find('[name=term]').val() ) {
      doSearch(buildQuery($form));
    }
  });

  function buildQuery($form) {
    // this just gets data out of the form
    var index = $form.find('[name=index]').val();
    var type = $form.find('[name="type"]:checked').val();
    var term = $form.find('[name="term"]').val();
    var matchWholePhrase = $form.find('[name="exact"]').is(':checked');
    var size = parseInt($form.find('[name="size"]').val());
    var from = parseInt($form.find('[name="from"]').val());

    // skeleton of the JSON object we will write to DB
    var query = {
      index: index,
      type: type
    };

    // size and from are used for pagination
    if( !isNaN(size) ) { query.size = size; }
    if( !isNaN(from) ) { query.from = from; }

    buildQueryBody(query, term, matchWholePhrase);

    return query;
  }

  function buildQueryBody(query, term, matchWholePhrase) {
    if( matchWholePhrase ) {
      var body = query.body = {};
      body.query = {
        // match_phrase matches the phrase exactly instead of breaking it
        // into individual words
        "match_phrase": {
          // this is the field name, _all is a meta indicating any field
          "_all": term
        }
        /**
         * Match breaks up individual words and matches any
         * This is the equivalent of the `q` string below
        "match": {
          "_all": term
        }
        */
      }
    }
    else {
      query.q = term;
    }
  }

  // conduct a search by writing it to the search/request path
  function doSearch(query) {
    var ref = database.ref().child(PATH);
    var key = ref.child('request').push(query).key;

    console.log('search', key, query);
    $('#query').text(JSON.stringify(query, null, 2));
    ref.child('response/'+key).on('value', showResults);
  }

  // when results are written to the database, read them and display
  function showResults(snap) {
    var dat = snap.val();
    if( dat === null ) { return; } // wait until we get data

    // when a value arrives from the database, stop listening
    // and remove the temporary data from the database
    snap.ref.off('value', showResults);
    snap.ref.remove();

    // the rest of this just displays data in our demo and probably
    // isn't very interesting
    var totalText = dat.total;
    if( dat.hits && dat.hits.length !== dat.total ) {
      totalText = dat.hits.length + ' of ' + dat.total;
    }
    $('#total').text('(' + totalText + ')');

    var $pair = $('#results')
      .text(JSON.stringify(dat, null, 2))
      .removeClass('error zero');
    if( dat.error ) {
      $pair.addClass('error');
    }
    else if( dat.total < 1 ) {
      $pair.addClass('zero');
    }
  }

  // display raw data for reference, this is just for the demo
  // and probably not very interesting
  database.ref().on('value', setRawData);
  function setRawData(snap) {
    $('#raw').text(JSON.stringify(snap.val(), null, 2));
  }
>>>>>>> firebase/master
})(jQuery);
