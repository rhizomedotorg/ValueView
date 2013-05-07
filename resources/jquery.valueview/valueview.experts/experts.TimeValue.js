/**
 * @file
 * @ingroup ValueView
 * @licence GNU GPL v2+
 * @author Daniel Werner < daniel.werner@wikimedia.de >
 * @author H. Snater < mediawiki@snater.com >
 */
( function( dv, vp, $, vv ) {
	'use strict';

	var PARENT = vv.BifidExpert,
		editableExpert = vv.experts.TimeInput;

	/**
	 * Valueview expert for handling time values.
	 *
	 * @since 0.1
	 *
	 * @constructor
	 * @extends jQuery.valueview.experts.BifidExpert
	 */
	vv.experts.TimeValue = vv.expert( 'timevalue', PARENT, {
		/**
		 * @see jQuery.valueview.BifidExpert._editableExpert
		 */
		_editableExpert: editableExpert,

		/**
		 * @see jQuery.valueview.BifidExpert._editableExpertOptions
		 */
		_editableExpertOptions: {},

		/**
		 * @see jQuery.valueview.BifidExpert._staticExpert
		 */
		_staticExpert: vv.experts.StaticDom,

		/**
		 * @see jQuery.valueview.BifidExpert._staticExpertOptions
		 */
		_staticExpertOptions: {
			/**
			 * @param {time.Time|null} currentRawValue
			 * @param {jQuery.valueview.ViewState} viewState
			 */
			domBuilder: function( currentRawValue, viewState ) {
				var $node = $( '<span/>' );

				if( !currentRawValue ) {
					return $node;
				}

				// Display the calendar being used if the date lies within a time frame when
				// multiple calendars have been in use or if the time value features a calendar that
				// is uncommon for the specified time:
				// TODO: This needs to be shaped more generic instead of focusing on Gregorian/Julian calendar.
				var year = currentRawValue.year();

				if(
					currentRawValue.precision() > 10
					&& (
						year > 1581 && year < 1930
						|| year <= 1581 && currentRawValue.calendarText() === 'Gregorian'
						|| year >= 1930 && currentRawValue.calendarText() === 'Julian'
					)
				) {
					$node
					.append( $( '<span/>' ).text( currentRawValue.text() ) )
					.append( $( '<sup/>' ).text( currentRawValue.calendarText() ) );
				} else {
					$node.text( currentRawValue.text() );
				}

				return $node;
			},
			baseExpert: editableExpert
		}
	} );

}( dataValues, valueParsers, jQuery, jQuery.valueview ) );