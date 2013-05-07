/**
 * List rotator widget
 *
 * The list rotator may be used to rotate through a list of values.
 * @licence GNU GPL v2+
 * @author H. Snater < mediawiki@snater.com >
 *
 * @option {Object[]} values Array of objects containing the values to rotate.
 *         Single object structure:
 *         { value: <actual value (being returned on value())>, label: <the value's label> }
 *
 * @option {Object} [menu] Options for the jQuery.menu widget used as drop-down menu:
 *         [menu.position] {Object} Default object passed to jQuery.ui.position when positioning the
 *                         menu.
 *
 * @option {boolean} [auto] Whether to display the "auto" link.
 *         Default value: true
 *
 * @option {string[]} [animationMargins] Defines how far the sections should be shifted when
 *         animating the rotation. First value when shifting to the left and vice versa. Values will
 *         be flipped in rtl context.
 *         Default value: ['-15px', '15px']
 *
 * @option {boolean} [deferInit] Whether to defer initializing the section widths until initWidths()
 *         is called "manually".
 *         Default value: false
 *
 * @event auto: Triggered when "auto" options is selected.
 *        (1) {jQuery.Event}
 *
 * @event selected: Triggered when a specific value is selected.
 *        (1) {jQuery.Event}
 *        (2) {*} Value as specified in the "values" option.
 *
 * @dependency jQuery.ui.Widget
 * @dependency jQuery.ui.menu
 * @dependency jQuery.ui.position
 */
( function( $ ) {
	'use strict';

	/**
	 * Whether loaded in MediaWiki context.
	 * @type {boolean}
	 */
	var IS_MW_CONTEXT = ( typeof mw !== 'undefined' && mw.msg );

	/**
	 * Whether actual listrotator resource loader module is loaded.
	 * @type {boolean}
	 */
	var IS_MODULE_LOADED = (
		IS_MW_CONTEXT
			&& $.inArray( 'jquery.ui.listrotator', mw.loader.getModuleNames() ) !== -1
		);

	/**
	 * Returns a message from the MediaWiki context if the listrotator module has been loaded.
	 * If it has not been loaded, the corresponding string defined in the options will be returned.
	 *
	 * @param {String} msgKey
	 * @param {String} string
	 * @return {String}
	 */
	function mwMsgOrString( msgKey, string ) {
		return ( IS_MODULE_LOADED ) ? mw.msg( msgKey ) : string;
	}

	/**
	 * Caches whether the widget is used in a rtl context. This, however, depends on using an "rtl"
	 * class on the document body like it is done in MediaWiki.
	 * @type {boolean}
	 */
	var isRtl = $( 'body' ).hasClass( 'rtl' );

	/**
	 * Measures the maximum width of a container according to a list of strings. The width is
	 * determined by the widest string.
	 *
	 * @param {jQuery} $container
	 * @param {string[]} strings
	 * @returns {number} The container's maximum width in pixel
	 */
	function measureMaximumStringWidths( $container, strings ) {
		var widths = [];
		$.each( strings, function( i, string ) {
			$container.empty().text( string );
			widths.push( $container.width() );
		} );
		$container.empty();
		return widths;
	}

	$.widget( 'ui.listrotator', {
		/**
		 * Additional options
		 * @type {Object}
		 */
		options: {
			values: [],
			menu: {
				position: {
					my: ( isRtl ) ? 'right top' : 'left top',
					at: ( isRtl ) ? 'right bottom' : 'left bottom',
					collision: 'none'
				}
			},
			auto: true,
			animationMargins: ['-15px', '15px'],
			deferInit: false,
			messages: {
				'auto': mwMsgOrString( 'valueview-listrotator-auto', 'auto' )
			}
		},

		$auto: null,

		/**
		 * Node of the previous list item section.
		 * @type {jQuery}
		 */
		$prev: null,

		/**
		 * Node of the current list item section.
		 * @type {jQuery}
		 */
		$curr: null,

		/**
		 * Node of the next list item section.
		 * @type {jQuery}
		 */
		$next: null,

		/**
		 * Node of the menu opening when clicking on the "current" section.
		 * @type {jQuery}
		 */
		$menu: null,

		/**
		 * Temporarily caching the value the rotator is rotating to while the animation is being
		 * performed.
		 * @type {*}
		 */
		_rotatingTo: null,

		/**
		 * @see $.ui.Widget._create
		 */
		_create: function() {
			var self = this,
				iconClasses = ['ui-icon ui-icon-triangle-1-w', 'ui-icon ui-icon-triangle-1-e'];

			// Flip triangle arrows in rtl context:
			if ( isRtl ) {
				iconClasses.reverse();
			}

			if ( this.options.values.length === 0 ) {
				throw new Error( 'List of values required to initialize list rotator.' );
			}

			this.element.addClass( this.widgetBaseClass + ' ui-widget-content' );

			// Construct "auto" link:
			this.$auto = this._createSection( 'auto', function( event ) {
				if( self.$auto.hasClass( 'ui-state-active' ) ) {
					return;
				}
				self.activate( self.$auto );
				self._trigger( 'auto' );
			} )
			.addClass( 'ui-state-active' );
			this.$auto.children( 'a' ).text( this.options.messages['show options'] );

			// Construct the basic sections:
			this.$curr = this._createSection( 'curr', function( event ) {
				if ( !self.$menu.is( ':visible' ) ) {
					self._showMenu();
				} else {
					self._hideMenu();
				}
			} )
			.append( $( '<a/>' ).addClass( 'ui-icon ui-icon-triangle-1-s' ) );

			this.$prev = this._createSection( 'prev', function( event ) {
				self.prev();
			} )
			.append( $( '<a/>' ).addClass( iconClasses[0] ) );

			this.$next = this._createSection( 'next', function( event ) {
				self.next();
			} )
			.append( $( '<a/>' ).addClass( iconClasses[1] ) );

			if( this.$auto ) {
				this.element.append( this.$auto );
			}
			this.element.append( this.$prev ).append( this.$curr ).append( this.$next );

			// Apply hover functionality:
			$.each( [ this.$auto, this.$curr, this.$prev, this.$next ], function( i, $node ) {
				$node
				.addClass( 'ui-state-default' )
				.on( 'mouseover', function( event ) {
					var $this = $( this );
					if( $this.hasClass( 'ui-state-disabled' ) ) {
						return;
					}
					$this.addClass( 'ui-state-hover' );
				} )
				.on( 'mouseout', function( event ) {
					var $this = $( this );
					if( $this.hasClass( 'ui-state-disabled' ) ) {
						return;
					}
					$this.removeClass( 'ui-state-hover' );
				} )
				.find( 'a' ).attr( 'href', 'javascript:void(0);' );
			} );

			// Construct and initialize menu widget:
			this._createMenu();

			// Attach event to html node to detect click outside of the menu closing the menu:
			if ( $( ':' + self.widgetBaseClass ).length === 1 ) {
				$( 'html' ).on( 'click.' + this.widgetBaseClass, function( event ) {
					$( ':' + self.widgetBaseClass ).each( function( i, node ) {
						$( node ).data( 'listrotator' ).$menu.hide();
					} );
				} );
			}

			// Prevent propagation of clicking on the "current" section as well as on the menu in
			// order to not trigger the event handler assigned to the html element.
			this.$menu.add( this.$curr ).on( 'click.' + this.widgetBaseClass, function( event ) {
				event.stopPropagation();
			} );

			// Focus on first element:
			this.value( this.options.values[0].value );

			if( !this.options.deferInit ) {
				this.initWidths();
			}

		},

		/**
		 * @see $.Widget.destroy
		 */
		destroy: function() {
			this.$menu.data( 'menu' ).destroy();
			this.$menu.remove();

			this.$auto.remove();
			this.$curr.remove();
			this.$prev.remove();
			this.$next.remove();

			this.element.removeClass( this.widgetBaseClass + ' ui-widget-content' );

			// Remove event attached to the html node if no instances of the widget exist anymore:
			if ( $( ':' + this.widgetBaseClass ).length === 0 ) {
				$( 'html' ).off( '.' + this.widgetBaseClass );
			}

			$.Widget.prototype.destroy.call( this );
		},

		/**
		 * Init the section widths.
		 */
		initWidths: function() {
			// Determine the maximum width a label may have and apply that width to each section:
			var currentLabel = this.$curr.children( '.' + this.widgetBaseClass + '-label' ).text(),
				labels = [],
				stringWidths = [],
				currMaxWidth = 0,
				prevMaxWidth = 0,
				nextMaxWidth = 0;

			$.each( this.options.values, function( i, v ) {
				labels.push( v.label );
			} );

			stringWidths = measureMaximumStringWidths(
				this.$curr.children( '.' + this.widgetBaseClass + '-label' ),
				labels
			);
			$.each( stringWidths, function( i, width ) {
				if( width > currMaxWidth ) {
					currMaxWidth = width;
				}
				if( i > 0 && width > prevMaxWidth ) {
					prevMaxWidth = width;
				}
				if( i < stringWidths.length && width > nextMaxWidth ) {
					nextMaxWidth = width;
				}
			} );

			this.$curr.children( '.' + this.widgetBaseClass + '-label' ).width( currMaxWidth );
			// The "previous" section will not be filled with the last string while the "next"
			// section will never be filled with the first string.
			this.$prev.children( '.' + this.widgetBaseClass + '-label' ).width( prevMaxWidth );
			this.$next.children( '.' + this.widgetBaseClass + '-label' ).width( nextMaxWidth );

			// Make menu width comply to the "current" section:
			var menuSpacing = this.$menu.outerWidth() - this.$menu.width();
			this.$menu.width( this.$curr.outerWidth() - menuSpacing );

			// Reset "current" section's label:
			this.$curr.children( '.' + this.widgetBaseClass + '-label' ).text( currentLabel );
		},

		/**
		 * Creates a widget section.
		 *
		 * @param {string} classSuffix
		 * @param {Function} clickCallback
		 * @return {jQuery}
		 */
		_createSection: function( classSuffix, clickCallback ) {
			return $( '<span/>' )
			.addClass( this.widgetBaseClass + '-' + classSuffix )
			.on( 'click.' + this.widgetBaseClass, function( event ) {
				if( !$( this ).hasClass( 'ui-state-disabled' ) ) {
					clickCallback( event );
				}
			} )
			.append( $( '<a/>' ).addClass( this.widgetBaseClass + '-label' ) );
		},

		/**
		 * Create the drop-down menu assigned to the "current" section.
		 */
		_createMenu: function() {
			var self = this;

			this.$menu = $( '<ul/>' )
			.addClass( this.widgetBaseClass + '-menu' )
			.appendTo( $( 'body' ) ).hide();

			$.each( this.options.values, function( i, v ) {
				self.$menu.append(
					$( '<li/>' )
					.append(
						$( '<a/>' )
						.attr( 'href', 'javascript:void(0);')
						.text( v.label )
						.on( 'click', function( event ) {
							self._trigger( 'selected', null, [ self.value( v.value ) ] );
							self.$menu.hide();
						} )
					)
					.data( 'value', v.value )
				);
			} );

			this.$menu.menu();
		},

		/**
		 * Sets/Gets the widget's value.
		 *
		 * TODO: Change behavior: value as setter should return "this" for allowing chaining calls
		 *  to the widget.
		 *
		 * @param [value] The value to assign. (Has to match a value actually existing in the
		 *        widget's options.)
		 * @return {string} Current value.
		 */
		value: function( value ) {
			// Get the current value:
			if ( value === undefined || value === this.$curr.data( 'value' ) ) {
				return this.$curr.data( 'value' );
			}

			var index = 0;

			this.$prev.add( this.$curr ).add( this.$next )
			.children( '.' + this.widgetBaseClass + '-label' ).empty();

			$.each( this.options.values, function( i, v ) {
				if ( value === v.value ) {
					index = i;
					return false;
				}
			} );

			this.$curr
			.data( 'value', this.options.values[index].value )
			.children( '.' + this.widgetBaseClass + '-label' )
			.text( this.options.values[index].label );

			if ( index > 0 ) {
				this.$prev
				.data( 'value', this.options.values[index - 1].value )
				.children( '.' + this.widgetBaseClass + '-label' )
				.text( this.options.values[index - 1].label );
			}

			if ( index < this.options.values.length - 1 ) {
				this.$next
				.data( 'value', this.options.values[index + 1].value )
				.children( '.' + this.widgetBaseClass + '-label' )
				.text( this.options.values[index + 1].label );
			}

			this.$prev.css( 'visibility', 'visible' );
			this.$next.css( 'visibility', 'visible' );
			if ( index === 0 ) {
				this.$prev.css( 'visibility', 'hidden' );
			} else if ( index === this.options.values.length - 1 ) {
				this.$next.css( 'visibility', 'hidden' );
			}

			// Alter menu item states:
			this.$menu.children( 'li' ).each( function( i, li ) {
				var $li = $( li );
				$li.removeClass( 'ui-state-active' );
				if( $li.data( 'value' ) === value ) {
					$li.addClass( 'ui-state-active' );
				}
			} );

			return value;
		},

		/**
		 * Sets a new value rotating to the new value.
		 *
		 * @param {*} newValue
		 */
		_setValue: function( newValue ) {
			var self = this;

			if( this.$curr.data( 'value' ) === newValue ) {
				// Value is set already.
				return;
			}

			this.rotate( newValue, function() {
				self.activate();
			} );
		},

		/**
		 * Rotates the widget to the next value.
		 */
		next: function() {
			this._setValue( this.$next.data( 'value' ) );
		},

		/**
		 * Rotates the widget to the previous value.
		 */
		prev: function() {
			this._setValue( this.$prev.data( 'value' ) );
		},

		/**
		 * Performs the rotation of the widget.
		 *
		 * @param {string} newValue
		 * @param {Function} [callback]
		 */
		rotate: function( newValue, callback ) {
			if( newValue === this._rotatingTo || !this._rotatingTo && newValue === this.$curr.data( 'value' ) ) {
				return;
			}

			this._rotatingTo = newValue;

			var self = this,
				margins = $.merge( [], this.options.animationMargins ),
				s = '.' + this.widgetBaseClass + '-label';

			var $nodes = this.$prev.children( s )
				.add( this.$curr.children( s ) )
				.add( this.$next.children( s ) );

			// Figure out whether rotating to the right or to the left:
			var beforeCurrent = true;
			$.each( this.options.values, function( i, v ) {
				if( v.value === newValue ) {
					return false;
				}
				if( v.value === self.$curr.data( 'value' ) ) {
					beforeCurrent = false;
					return false;
				}
			} );

			if( beforeCurrent ) {
				margins.reverse();
			}

			if ( isRtl ) {
				margins.reverse();
			}

			$nodes.animate(
				{
					marginLeft: margins[0],
					marginRight: margins[1],
					opacity: 0
				}, {
					done: function() {
						$nodes.css( {
							marginLeft: '0',
							marginRight: '0',
							opacity: 1
						} );
						self._trigger( 'selected', null, [ self.value( newValue ) ] );
						self._rotatingTo = null;
						if( $.isFunction( callback ) ) {
							callback();
						}
					},
					duration: 150
				}
			);
		},

		/**
		 * Activates the widget.
		 *
		 * @param {jQuery} [$section] Section to activate. "Current" section by default.
		 */
		activate: function( $section ) {
			this.$curr.add( this.$auto ).removeClass( 'ui-state-hover' ).removeClass( 'ui-state-active' );
			if( $section === undefined ) {
				$section = this.$curr;
			}
			$section.addClass( 'ui-state-active' );
		},

		/**
		 * De-activates the widget.
		 */
		deactivate: function() {
			this.$curr.add( this.$auto ).removeClass( 'ui-state-active' );
		},

		/**
		 * Shows the drop-down menu.
		 */
		_showMenu: function() {
			this.$menu.slideDown( 150 );
			this.$menu.position( $.extend( {
				of: this.$curr
			}, this.options.menu.position ) );
			this.activate();
		},

		/**
		 * Hides the drop-down menu.
		 */
		_hideMenu: function() {
			this.$menu.slideUp( 150 );
			this.activate();
		},

		/**
		 * Disables the widget.
		 */
		disable: function() {
			this.$prev.add( this.$curr ).add( this.$next )
			.addClass( 'ui-state-disabled' );
		},

		/**
		 * Enables the widget.
		 */
		enable: function() {
			this.$prev.add( this.$curr ).add( this.$next )
			.removeClass( 'ui-state-disabled' );
		}

	} );

} )( jQuery );