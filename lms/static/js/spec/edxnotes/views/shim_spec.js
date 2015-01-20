define([
    'jquery', 'underscore', 'annotator', 'js/edxnotes/views/notes_factory', 'jasmine-jquery'
], function($, _, Annotator, NotesFactory) {
    'use strict';
    describe('EdxNotes Shim', function() {
        var annotators, highlights;

        function checkAnnotatorIsFrozen(annotator) {
            expect(annotator.isFrozen).toBe(true);
            expect(annotator.onHighlightMouseover).not.toHaveBeenCalled();
            expect(annotator.startViewerHideTimer).not.toHaveBeenCalled();
        }

        function checkAnnotatorIsUnfrozen(annotator) {
            expect(annotator.isFrozen).toBe(false);
            expect(annotator.onHighlightMouseover).toHaveBeenCalled();
            expect(annotator.startViewerHideTimer).toHaveBeenCalled();
        }

        function checkClickEventsNotBound(namespace) {
            var events = $._data(document, 'events').click;

            _.each(events, function(event) {
                expect(event.namespace.indexOf(namespace)).toBe(-1);
            });
        }

        beforeEach(function() {
            loadFixtures('js/fixtures/edxnotes/edxnotes_wrapper.html');
            highlights = [];
            annotators = [
                NotesFactory.factory($('#edx-notes-wrapper-123').get(0), {
                    endpoint: 'http://example.com/'
                }),
                NotesFactory.factory($('#edx-notes-wrapper-456').get(0), {
                    endpoint: 'http://example.com/'
                })
            ];
            _.each(annotators, function(annotator) {
                highlights.push($('<span class="annotator-hl" />').appendTo(annotator.element));
                spyOn(annotator, 'onHighlightClick').andCallThrough();
                spyOn(annotator, 'onHighlightMouseover').andCallThrough();
                spyOn(annotator, 'startViewerHideTimer').andCallThrough();
            });
            spyOn($.fn, 'off').andCallThrough();
        });

        afterEach(function () {
            _.invoke(Annotator._instances, 'destroy');
        });

        it('clicking on highlights does not open the viewer when the editor is opened', function() {
            spyOn(annotators[1].editor, 'isShown').andReturn(false);
            highlights[0].click();
            annotators[1].editor.isShown.andReturn(true);
            highlights[1].click();
            expect($('#edx-notes-wrapper-123 .annotator-viewer')).not.toHaveClass('annotator-hide');
            expect($('#edx-notes-wrapper-456 .annotator-viewer')).toHaveClass('annotator-hide');
        });

        it('clicking a highlight freezes mouseover and mouseout in all highlighted text', function() {
            _.each(annotators, function(annotator) {
                expect(annotator.isFrozen).toBe(false);
            });
            highlights[0].click();
            // Click is attached to the onHighlightClick event handler which
            // in turn calls onHighlightMouseover.
            // To test if onHighlightMouseover is called or not on
            // mouseover, we'll have to reset onHighlightMouseover.
            annotators[0].onHighlightMouseover.reset();
            // Check that both instances of annotator are frozen
            _.invoke(highlights, 'mouseover');
            _.invoke(highlights, 'mouseout');
            _.each(annotators, checkAnnotatorIsFrozen);
        });

        it('clicking twice reverts to default behavior', function() {
            highlights[0].click();
            $(document).click();
            annotators[0].onHighlightMouseover.reset();

            // Check that both instances of annotator are unfrozen
            _.invoke(highlights, 'mouseover');
            _.invoke(highlights, 'mouseout');
            _.each(annotators, function(annotator) {
                checkAnnotatorIsUnfrozen(annotator);
            });
        });

        it('destroying an instance with an open viewer sets all other instances' +
           'to unfrozen and unbinds document click.edxnotes:freeze event handlers', function() {
            // Freeze all instances
            highlights[0].click();
            // Destroy first instance
            annotators[0].destroy();

            // Check that all click.edxnotes:freeze are unbound
            checkClickEventsNotBound('edxnotes:freeze');

            // Check that the remaining instance is unfrozen
            highlights[1].mouseover();
            highlights[1].mouseout();
            checkAnnotatorIsUnfrozen(annotators[1]);
        });

        it('destroying an instance with an closed viewer only unfreezes that instance' +
           'and unbinds one document click.edxnotes:freeze event handlers', function() {
            // Freeze all instances
            highlights[0].click();
            annotators[0].onHighlightMouseover.reset();
            // Destroy second instance
            annotators[1].destroy();

            // Check that the first instance is frozen
            highlights[0].mouseover();
            highlights[0].mouseout();
            checkAnnotatorIsFrozen(annotators[0]);

            // Check that second one doesn't have a bound click.edxnotes:freeze
            checkClickEventsNotBound('edxnotes:freeze' + annotators[1].uid);
        });

        it('should unbind events on destruction', function() {
            annotators[0].destroy();
            expect($.fn.off).toHaveBeenCalledWith(
                'click', annotators[0].onNoteClick
            );
            expect($.fn.off).toHaveBeenCalledWith(
                'click', '.annotator-hl'
            );
        });
    });
});
