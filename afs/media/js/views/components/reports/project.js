define([
    'jquery',
    'underscore',
    'knockout',
    'arches',
    'utils/resource',
    'utils/report',
    'views/components/reports/scenes/name'
], function($, _, ko, arches, resourceUtils, reportUtils) {
    return ko.components.register('project-report', {
        viewModel: function(params) {
            var self = this;
            params.configKeys = ['tabs', 'activeTabIndex'];
            Object.assign(self, reportUtils);
            self.sections = [
                {id: 'name', title: 'Names, Identifiers, Classification'},
                {id: 'substance', title: 'Project Timeline'},
                {id: 'parthood', title: 'Parent Project'},
                {id: 'components', title: 'Component Projects'},
                {id: 'description', title: 'Description'},
                {id: 'documentation', title: 'Documentation'},
                {id: 'json', title: 'JSON'},
            ];
            self.reportMetadata = ko.observable(params.report?.report_json);
            self.resource = ko.observable(self.reportMetadata()?.resource);
            self.displayname = ko.observable(ko.unwrap(self.reportMetadata)?.displayname);
            self.activeSection = ko.observable('name');
            self.nameDataConfig = {
                exactMatch: undefined
            };
            self.documentationDataConfig = {
                label: undefined,
                subjectOf: 'influenced by',
            };
            self.substanceDataConfig = {
                dimension: undefined,
                timespan: {path: 'timespan', key: 'dates of project'}
            };
            self.nameCards = {};
            self.descriptionCards = {};
            self.documentationCards = {};
            self.summary = params.summary;

            self.threeWideTableConfig = {
                ...self.defaultTableConfig,
                columns: Array(3).fill(null)
            };

            self.fourWideTableConfig = {
                ...self.defaultTableConfig,
                columns: Array(4).fill(null)
            };

            self.collectionOfChildProjects = ko.observableArray();
            self.visible = {
                childProjects: ko.observable(true),
                names: ko.observable(true),
                identifiers: ko.observable(true),
                classifications: ko.observable(true)
            };

            const resourceId = ko.unwrap(self.reportMetadata).resourceinstanceid;
            const loadRelatedResources = async() => {
                const result = await reportUtils.getRelatedResources(resourceId);
                const relatedResources = result?.related_resources;
                const relationships = result?.resource_relationships;

                const relatedProjects = relationships.filter(relationship => 
                    relationship?.resourceinstancefrom_graphid === relationship?.resourceinstanceto_graphid).map(
                        relatedProject => relatedProject.resourceinstanceidfrom);
                    
                self.collectionOfChildProjects(relatedResources.filter(relatedResource => 
                    relatedProjects.includes(relatedResource.resourceinstanceid)));

                self.collectionOfChildProjects().map(child => {
                    child.link = reportUtils.getResourceLink({resourceId: child.resourceinstanceid}),
                    child.displaydescription = reportUtils.stripTags(child.displaydescription)
                    return child
                });
            };

            loadRelatedResources();

            if(params.report.cards){
                const cards = params.report.cards;
                
                self.cards = self.createCardDictionary(cards)

                self.nameCards = {
                    name: self.cards?.['name of project'],
                    identifier: self.cards?.['identifier for project'],
                    type: self.cards?.['scale of project']
                };
                self.descriptionCards = {
                    statement: self.cards?.['statement about project'],
                };
                self.documentationCards = {
                    digitalReference: self.cards?.['digital reference to project'],
                    subjectOf: self.cards?.['source reference work for project'],
                };
                self.substanceCards = {
                    timespan: self.cards?.['dates of project'],
                };
            };

            self.parthoodData = ko.observable({
                sections: 
                    [
                        {
                            title: 'Parent Project', 
                            data: [{
                                key: 'parent project', 
                                value: self.getRawNodeValue(self.resource(), 'part of'), 
                                card: self.cards?.['parent project'],
                                type: 'resource'
                            }]
                        }
                    ]
            });
            self.temporalData = ko.observable({
                sections: [
                    {
                        title: 'Temporal Relations of Project', 
                        data: [
                            /*{
                                key: 'Project Period', 
                                value: self.getRawNodeValue(self.resource(), 'during'), 
                                card: self.cards?.['temporal relations of project'],
                                type: 'resource'
                            },*/
                            {
                                key: 'Occurs After Event', 
                                value: self.getRawNodeValue(self.resource(), 'starts after'), 
                                card: self.cards?.['temporal relations of project'],
                                type: 'resource'
                            },{
                                key: 'Occurs Before Event', 
                                value: self.getRawNodeValue(self.resource(), 'ends before'), 
                                card: self.cards?.['temporal relations of project'],
                                type: 'resource'
                            }
                        ]
                    }
                ]
            });
            self.parameterData = ko.observable({
                sections: [
                    {
                        title: 'Project Team', 
                        data: [{
                            key: 'project team', 
                            value: self.getRawNodeValue(self.resource(), 'carried out by'), 
                            card: self.cards?.['project team'],
                            type: 'resource'
                        }]
                    },
                    {
                        title: 'Activity Type of Project', 
                        data: [{
                            key: 'activity type of project', 
                            value: self.getRawNodeValue(self.resource(), 'technique'), 
                            card: self.cards?.['activity type of project'],
                            type: 'resource'
                        }]
                    }
                ]
            });

            ////// Search Details section //////
            self.namesSearchData = ko.observable();
            self.timeSpanSearchData = ko.observable();
            self.activityTypeSearchData = ko.observable();
            self.parentSearchData = ko.observable();
            self.teamSearchData = ko.observable();
            self.statementsSearchData = ko.observable();
            self.identiferSearchData = ko.observable();

            const nameData = self.resource()?.Name;
            if (nameData) {
                self.namesSearchData(nameData.map(x => {
                    const type = self.getNodeValue(x, 'Name_type');
                    const content = self.getNodeValue(x, 'Name_content');
                    const language = self.getNodeValue(x, 'Name_language');
                    const tileid = self.getTileId(x);
                    return { type, content, language, tileid }
                }));
            };

            const timeSpanData = self.resource()?.TimeSpan;
            if(timeSpanData) {
                const beginningStart = self.getNodeValue(timeSpanData, 'TimeSpan_begin of the begin');
                const beginningComplete = self.getNodeValue(timeSpanData, 'TimeSpan_begin of the end');
                const endingStart = self.getNodeValue(timeSpanData, 'TimeSpan_end of the begin');
                const endingComplete = self.getNodeValue(timeSpanData, 'TimeSpan_end of the end');
                
                let name;
                if (timeSpanData['TimeSpan_name']) {
                    name = self.getNodeValue(timeSpanData['TimeSpan_name'][0], 'TimeSpan_name_content');
                } 

                // if(timeSpanData['TimeSpan_duration'])
            
                self.timeSpanSearchData({
                    sections: [{
                    title: 'TimeSpan',
                    data: [{
                        key: 'Timespan',
                        value: {
                            beginningComplete, 
                            beginningStart, 
                            endingComplete, 
                            endingStart,
                            name, 
                        },
                        cards: {},
                        type: 'timespan'
                    }]
                }]});
            }


            self.activityTypeSearchData(self.getRawNodeValue(self.resource(), 'technique'));

            self.parentSearchData(self.getRawNodeValue(self.resource(), 'part of'));

            self.teamSearchData(self.getRawNodeValue(self.resource(), 'carried out by'));

            const statmentData = self.resource()?.Statement;
            if (statmentData) {
                self.statementsSearchData(statmentData.map(x => {
                    const type = self.getNodeValue(x, 'Statement_type');
                    const content = self.getNodeValue(x, 'Statement_content');
                    const language = self.getNodeValue(x, 'Statement_language');
                    const tileid = self.getTileId(x);
                    return { type, content, language, tileid }
                }));
            };

            const identiferData = self.resource()?.Identifier;
            if (identiferData) {
                self.identiferSearchData(identiferData.map(x => {
                    const type = self.getNodeValue(x, 'Identifier_type');
                    const content = self.getNodeValue(x, 'Identifier_content');
                    const tileid = self.getTileId(x);
                    return { type, content, tileid }
                }));
            };
        },
        template: { require: 'text!templates/views/components/reports/project.htm' }
    });
});
