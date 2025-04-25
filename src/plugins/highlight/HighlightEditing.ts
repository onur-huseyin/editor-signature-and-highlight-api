import { Plugin } from '@ckeditor/ckeditor5-core';
import { toWidget } from '@ckeditor/ckeditor5-widget/src/utils';

export default class HighlightEditing extends Plugin {
    init() {
        this._defineSchema();
        this._defineConverters();
    }

    _defineSchema() {
        const schema = this.editor.model.schema;

        schema.register('highlight', {
            allowWhere: '$text',
            allowContentOf: '$block',
            allowAttributes: ['comment']
        });
    }

    _defineConverters() {
        const conversion = this.editor.conversion;

        // Model -> View (Editing)
        conversion.for('editingDowncast').elementToElement({
            model: 'highlight',
            view: (modelElement, { writer: viewWriter }) => {
                const comment = modelElement.getAttribute('comment') || '';
                
                const span = viewWriter.createContainerElement('span', {
                    class: 'highlight',
                    'data-comment': comment
                });

                return toWidget(span, viewWriter);
            }
        });

        // Model -> View (Data)
        conversion.for('dataDowncast').elementToElement({
            model: 'highlight',
            view: (modelElement, { writer: viewWriter }) => {
                const comment = modelElement.getAttribute('comment') || '';
                
                return viewWriter.createContainerElement('span', {
                    class: 'highlight',
                    'data-comment': comment
                });
            }
        });

        // View -> Model
        conversion.for('upcast').elementToElement({
            view: {
                name: 'span',
                classes: ['highlight']
            },
            model: (viewElement, { writer: modelWriter }) => {
                const comment = viewElement.getAttribute('data-comment') || '';
                
                return modelWriter.createElement('highlight', {
                    comment: comment
                });
            }
        });
    }
} 