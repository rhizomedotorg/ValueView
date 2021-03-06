/**
 * @licence GNU GPL v2+
 * @author H. Snater < mediawiki@snater.com >
 */

( function( $, QUnit ) {
	'use strict';

	/**
	 * Creates an input element suitable for testing.
	 * @return {jQuery}
	 */
	function createTestInput() {
		return $( '<input/>' ).addClass( 'test-autocompletestring' ).appendTo( 'body' );
	}

	QUnit.module( 'jquery.autocompletestring', {
		teardown: function() {
			$( '.test-autocompletestring' ).remove();
		}
	} );

	QUnit.test( 'Adapt letter case', function( assert ) {
		var $input = createTestInput();

		assert.equal(
			$input.autocompletestring( 'a', 'abc' ).val(),
			'abc',
			'Auto-completed \'a\' to \'abc\'.'
		);

		assert.equal(
			$input.autocompletestring( '12', '123' ).val(),
			'123',
			'Auto-completed \'12\' to \'123\'.'
		);

		assert.equal(
			$input.autocompletestring( 'abc', 'abc' ).val(),
			'abc',
			'Value remains the same when \'incomplete\' and \'complete\' string match.'
		);

		assert.equal(
			$input.autocompletestring( 'a', 'ABC' ).val(),
			'abc',
			'No auto-completion is performed when \'incomplete\' is not part of \'complete\' '
				+ 'string. Input value remains unchanged.'
		);
	} );

	QUnit.test( 'selectText()', function( assert ) {
		var $input = createTestInput().val( '0123456789' );

		assert.equal(
			$.fn.autocompletestring.selectText( $input[0], 0, 1 ),
			1,
			'Applied text selection with length of 1.'
		);

		assert.equal(
			$.fn.autocompletestring.selectText( $input[0], 0, 20 ),
			10,
			'Applied a text selection with the input value\'s character length since it is shorter '
				+ 'than the selection length trying to apply.'
		);

	} );

}( jQuery, QUnit ) );
