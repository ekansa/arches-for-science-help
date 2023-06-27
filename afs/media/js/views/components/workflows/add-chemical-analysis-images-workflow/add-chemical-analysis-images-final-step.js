define([
    'knockout',
    'underscore',
    'uuid',
    'arches',
    'views/components/workflows/summary-step',
    'templates/views/components/workflows/add-chemical-analysis-images-workflow/add-chemical-analysis-images-final-step.htm',
    'views/components/annotation-summary',
], function(ko, _, uuid, arches, SummaryStep, addChemicalAnalysisImagesFinalStepTemplate) {

    function viewModel(params) {
        var self = this;
        params.form.resourceId(params.relatedProjectData.observation);
        self.relatedDigitalResources = ko.observableArray()
        self.workflowDigitalResources = ko.observableArray()
        self.workflowManifestResource = ko.observable()
        self.digitalResourcesIds = params.digitalResourcesIds.digitalResourceInstancesIds;
        self.manifestResourceId = params.manifestResourceId.ManifestResourceId;

        SummaryStep.apply(this, [params]);

        this.resourceData.subscribe(function(val){
            this.displayName = val['displayname'] || 'unnamed';
            this.reportVals = {
                projectName: {'name': 'Project', 'value': params.relatedProjectData.projectName, 'resourceid': params.relatedProjectData.project},
                observationName: {'name': 'Observation', 'value': params.relatedProjectData.observationName, 'resourceid': params.relatedProjectData.observation},
            };
            this.loading(false);
        }, this);

        this.getWorkflowResourceData = async function(resourceid) {
            const response = await window.fetch(this.urls.api_resources(resourceid) + '?format=json&compact=false&v=beta')
            return await response.json()
        };

        (async (val) => {
            self.workflowDigitalResources(await Promise.all(self.digitalResourcesIds.map( async function(resourceid){
                return await self.getWorkflowResourceData(resourceid);
            })));
        })();

        (async (val) => {
            self.workflowManifestResource(await self.getWorkflowResourceData(self.manifestResourceId))
        })()

    }

    ko.components.register('add-chemical-analysis-images-final-step', {
        viewModel: viewModel,
        template: addChemicalAnalysisImagesFinalStepTemplate
    });
    return viewModel;
});
