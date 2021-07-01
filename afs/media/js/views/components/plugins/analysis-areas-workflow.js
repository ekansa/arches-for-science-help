define([
    'knockout',
    'jquery',
    'arches',
    'viewmodels/workflow',
    'viewmodels/workflow-step',
    'views/components/workflows/workflow-manifest-manager',
    'views/components/workflows/analysis-areas-workflow/analysis-areas-final-step',
], function(ko, $, arches, Workflow) {
    return ko.components.register('analysis-areas-workflow', {
        viewModel: function(params) {
            var self = this;

            this.resourceId = ko.observable();

            params.steps = [
                {
                    title: 'Object',
                    name: 'object-step', /* unique to workflow */
                    informationboxdata: {
                        heading: 'Workflow Goal: Record Locations and Regions of Interest',
                        text: `
                            Regions of interest are the areas on a physical object (whole object or sample) in which a measurement -- whether non-invasive or minimally invasive -- was performed.
                            To be meaningful, you need to describe the location or region of a physical object that is being described/measured.
                            This workflow will guide you through the steps to document the location of your regions of interest.
                        `,
                    },
                    component: 'views/components/workflows/component-based-step',
                    componentname: 'component-based-step',
                    required: false,
                    shouldtrackresource: true,
                    layoutSections: [
                        {
                            sectionTitle: 'Object or Sample',
                            componentConfigs: [
                                { 
                                    componentName: 'resource-instance-select-widget',
                                    uniqueInstanceName: 'sample-object-resource-instance', /* unique to step */
                                    tilesManaged: 'none',
                                    parameters: {
                                        graphids: [
                                            '9519cb4f-b25b-11e9-8c7b-a4d18cec433a',  /* physical thing */
                                        ],
                                    },
                                },
                            ], 
                        },
                    ],
                },
                {
                    title: 'Image',
                    name: 'image-step', /* unique to workflow */
                    component: 'views/components/workflows/component-based-step',
                    componentname: 'component-based-step',
                    required: false,
                    layoutSections: [
                        {
                            sectionTitle: 'Image Service',
                            componentConfigs: [
                                { 
                                    componentName: 'workflow-manifest-manager',
                                    uniqueInstanceName: 'image-service-instance', /* unique to step */
                                    tilesManaged: 'one',
                                    parameters: {
                                        graphid: '9519cb4f-b25b-11e9-8c7b-a4d18cec433a'
                                    },
                                },
                            ], 
                        },
                    ],
                },
                {
                    title: 'Summary',
                    name: 'analysis-areas-complete',  /* unique to workflow */
                    description: 'Summary',
                    component: 'views/components/workflows/component-based-step',
                    componentname: 'component-based-step',
                    graphid: '9519cb4f-b25b-11e9-8c7b-a4d18cec433a', //physical thing graph
                    nodegroupid: '',
                    resourceid: '2b8293dd-d5c1-4934-8664-0c3d51764689',
                    tileid: null,
                    layoutSections: [
                        {
                            componentConfigs: [
                                { 
                                    componentName: 'analysis-areas-final-step',
                                    uniqueInstanceName: 'analysis-areas-final',
                                    tilesManaged: 'none',
                                    parameters: {
                                    },
                                },
                            ], 
                        },
                    ],
                }
            ];

            Workflow.apply(this, [params]);
            this.quitUrl = arches.urls.plugin('init-workflow');
            self.getJSON('analysis-areas-workflow');

            self.ready(true);
        },
        template: { require: 'text!templates/views/components/plugins/analysis-areas-workflow.htm' }
    });
});
