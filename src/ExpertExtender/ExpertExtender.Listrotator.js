( function( $, ExpertExtender ) {
	'use strict';

	/**
	 * An `ExpertExtender` module for a `jQuery.ui.listrotator`.
	 * @class jQuery.valueview.ExpertExtender.Listrotator
	 * @since 0.6
	 * @licence GNU GPL v2+
	 * @author Adrian Lang <adrian.lang@wikimedia.de>
	 *
	 * @constructor
	 *
	 * @param {string} className
	 * @param {Object[]} values
	 * @param {Function} onValueChange Callback to be triggered when the listrotator's value is
	 *        changed.
	 * @param {Function} getUpstreamValue Callback to retrieve the value from a parent component.
	 */
	ExpertExtender.Listrotator = function( className, values, onValueChange, getUpstreamValue ) {
		this._onValueChange = onValueChange;
		this._getUpstreamValue = getUpstreamValue;

		var $rotator = $( '<div/>' )
			.addClass( className )
			.listrotator( {
				values: values,
				deferInit: true
			} );
		this.rotator = $rotator.data( 'listrotator' );
	};

	$.extend( ExpertExtender.Listrotator.prototype, {
		/**
		 * @property {Function}
		 * @private
		 */
		_onValueChange: null,

		/**
		 * @property {Function}
		 * @private
		 */
		_getUpstreamValue: null,

		/**
		 * @property {jQuery}
		 * @private
		 */
		_$customItem: null,

		/**
		 * @property {number|null}
		 * @private
		 */
		_customValueIndex: null,

		/**
		 * @property {jQuery.ui.listrotator}
		 */
		rotator: null,

		/**
		 * Callback for the `init` `ExpertExtender` event.
		 *
		 * @param {jQuery} $extender
		 */
		init: function( $extender ) {
			var self = this,
				listrotatorEvents = 'listrotatorauto listrotatorselected';

			this.rotator.element
			.on( listrotatorEvents, function( event, newValue ) {
				if( newValue !== self._getUpstreamValue() ) {
					self._onValueChange( newValue );
				}
			} )
			.appendTo( $extender );

			this.rotator.initWidths();
		},

		/**
		 * Callback for the `draw` `ExpertExtender` event.
		 */
		draw: function() {
			var value = this._getUpstreamValue();
			if( !value ) {
				return;
			}

			if( this._$customItem ) {
				this.rotator.options.values.splice( this._customValueIndex, 1 );
				this._$customItem.remove();
				this._$customItem = null;
				this._customValueIndex = null;
			}
			if( value.custom ) {
				this._customValueIndex = this.rotator.options.values.push( value ) - 1;
				this._$customItem = this.rotator._addMenuItem( value );
				value = value.value;
			}

			if( this.rotator.autoActive() || this._$customItem ) {
				this.rotator.value( value );
				this.rotator._setValue( value );
				if( this._$customItem ) {
					this.rotator.$menu.data( 'menu' ).refresh();
					this.rotator.activate(); // disables autoActive state
				}
			}
		},

		/**
		 * Callback for the `destroy` `ExpertExtender` event.
		 */
		destroy: function() {
			if( this.rotator ) {
				this.rotator.destroy();
				this.rotator = null;
			}
			this._getUpstreamValue = null;
			this._onValueChange = null;
		},

		/**
		 * Gets the current value set in the rotator.
		 *
		 * @return {string|null} The current value or null, if autoActive
		 */
		getValue: function() {
			return this.rotator.autoActive() ? null : this.rotator.value();
		}
	} );

} ( jQuery, jQuery.valueview.ExpertExtender ) );
