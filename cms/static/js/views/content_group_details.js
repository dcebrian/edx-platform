/**
 * This class defines a simple display view for a content group.
 * It is expected to be backed by a Group model.
 */
define([
    'js/views/baseview', 'underscore', 'gettext', 'underscore.string'
], function(BaseView, _, gettext, str) {
    'use strict';

    var ContentGroupDetailsView = BaseView.extend({
        tagName: 'div',
        events: {
            'click .edit': 'editGroup',
            'click .show-groups': 'showContentGroups',
            'click .hide-groups': 'hideContentGroups'
        },

        className: function () {
            var index = this.model.collection.indexOf(this.model);

            return [
                'collection',
                'content-group-details',
                'content-group-details-' + index
            ].join(' ');
        },

        editGroup: function() {
            this.model.set({'editing': true});
        },

        initialize: function() {
            this.template = this.loadTemplate('content-group-details');
            this.listenTo(this.model, 'change', this.render);
        },

        render: function() {
           var attrs = $.extend({}, this.model.attributes, {
                usageCountMessage: this.getUsageCountTitle(),
                outlineAnchorMessage: this.getOutlineAnchorMessage(),
                index: this.model.collection.indexOf(this.model)
            });
            this.$el.html(this.template(attrs));
            return this;
        },

        showContentGroups: function(event) {
            if (event && event.preventDefault) { event.preventDefault(); }
            this.model.set('showContentGroups', true);
        },

        hideContentGroups: function(event) {
            if (event && event.preventDefault) { event.preventDefault(); }
            this.model.set('showContentGroups', false);
        },

        getUsageCountTitle: function () {
            var count = this.model.get('usage').length, message;

            if (count === 0) {
                message = gettext('Not in Use');
            } else {
                message = ngettext(
                    /*
                        Translators: 'count' is number of units that the group
                        configuration is used in.
                    */
                    'Used in %(count)s unit', 'Used in %(count)s units',
                    count
                );
            }

            return interpolate(message, { count: count }, true);
        },

        getOutlineAnchorMessage: function () {
            var message = gettext(
                    /*
                        Translators: 'outlineAnchor' is an anchor pointing to
                        the course outline page.
                    */
                    'This Content Group is not in use. Start by adding a content group to any Unit via the %(outlineAnchor)s.'
                ),
                anchor = str.sprintf(
                    '<a href="%(url)s" title="%(text)s">%(text)s</a>',
                    {
                            url: this.model.collection.parents[0].outlineUrl,
                            text: gettext('Course Outline')
                    }
                );

            return str.sprintf(message, {outlineAnchor: anchor});
        }

    });

    return ContentGroupDetailsView;
});
