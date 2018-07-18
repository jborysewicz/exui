export namespace exui {

    export interface Action {
        name: string
        execute?(context?: any, platform?: Platform): any
        matchesContext?(context: any): boolean
        leafs?: Action[]
    }

    export interface Platform {
        context: any;
        jobs: Job[];

        currentJob: Job;

        createJob(): Job;
        setAsCurrent(job: Job): void;

        execute(action: Action): void;
        openViewSwitcher(): void

        actionManager: ActionManager;
    }

    export interface Job {
        id: string;
        views: View[];
        context?: any;
        currentView: View;

        addView(component: any): View;
        setAsCurrent(view: View): void;
        // removeView(view: ExecutionResult<T>): void;
    }

    export interface View {
        name: string,
        component: any
    }

    export interface SearchResult {
        action: Action,
        confidence: number
    }

    export interface ActionManager {
        findActionsMatchingPhrase(phrase: string): Action[];
        findActionByFlatName(actionId: string): Action;
    }

    export class DefaultActionManager implements ActionManager {


        public flatActions: Action[] = [];

        constructor(private rootAction: Action, private dataSource: ContextDataSource) {
            this.buildFlatActions();
        }

        private buildFlatActions(): any {
            const deepSearch = (action: Action): Action[] => {

                let childActions: Action[] = [];

                if (action.leafs) {
                    action.leafs.forEach(leaf => {
                        const result = deepSearch(leaf);
                        if (result.length > 0) {
                            result.forEach(r => { childActions.push(r) });
                        }
                    });
                }

                if (childActions.length > 0) {
                    childActions = childActions.map(child => {
                        return {
                            name: action.name.concat(".").concat(child.name).toLowerCase(),
                            execute: (context: any, platform: Platform) => {
                                const childContext = child.execute ? child.execute(context, platform) : context;
                                return action.execute(childContext, platform);
                            },
                            matchesContext: child.matchesContext
                        }
                    })
                } else {
                    childActions.push(action)
                }

                return childActions
            }

            this.flatActions = [];
            this.rootAction.leafs.forEach(leaf => {
                this.flatActions = [...this.flatActions, ...deepSearch(leaf)];
            })
        }

        public findActionsMatchingPhrase(phrase: string): Action[] {
            const coverPhrase = (coveringString: string, phrase: string): [string, boolean] => {
                let difference = phrase;
                for (let i = 0; i < coveringString.length; i++) {
                    difference = difference.replace(coveringString[i], "")
                }
                return [difference, difference.length < phrase.length];
            }
            const hitByPhrase = (phrase: string, a: Action): SearchResult => {
                const parts = a.name.split(".")

                let hitCount = 0;
                let phraseCovered = phrase;
                parts.forEach(namePart => {

                    let beginIndex = 0;
                    let currentIndex = 0;

                    while (beginIndex + currentIndex < phrase.length) {
                        const testPhrase = phrase.substr(beginIndex, ++currentIndex);
                        if (namePart.toLocaleLowerCase().indexOf(testPhrase) != -1) {
                            const [newCoveredPhrase, coverOccured] = coverPhrase(testPhrase, phraseCovered);
                            if (coverOccured) {
                                hitCount++
                            }
                            phraseCovered = newCoveredPhrase
                        } else {
                            beginIndex += 1;
                            currentIndex = 0;
                        }
                    }
                })

                if (phraseCovered.length > 0) {
                    hitCount = 0;
                }

                return {
                    action: a,
                    confidence: (hitCount * 100) / parts.length
                };

            }
            const deepSearch = (a: exui.Action, phrase: string, appender: (a: any) => void): void => {
                const result = hitByPhrase(phrase, a)
                if (result.confidence > 0 && (!a.matchesContext || a.matchesContext(this.dataSource.context))) {
                    appender(result);
                }

                if (a.leafs) {
                    a.leafs.forEach(a => deepSearch(a, phrase, appender))
                }
            }

            let results: exui.SearchResult[] = [];
            const appender = (searchResult: exui.SearchResult) => {
                console.log(searchResult);

                results.push(searchResult);
            }
            this.flatActions.forEach(fa => { deepSearch(fa, phrase, appender) })
            results = results.sort((p, n) => {
                return -1 * (p.confidence - n.confidence)
            })

            return results.map(r => r.action);
        }

        findActionByFlatName(actionId: string): Action {
            const action = this.flatActions.find(fa => {
                return fa.name == actionId;
            })

            return action;
        }

    }

    export interface ContextDataSource {
        context?: any
    }

    export interface PlatformDataSource extends ContextDataSource {
        rootAction: exui.Action;
    }


    export interface PlatformDelegate {

        createNewView(id: string, context: any, component: any): View;

        platformWillSwitchJob?(job: exui.Job): boolean;
        platformDidSwitchJob(job: exui.Job): void;

        plaftormWillSwitchView?(view: exui.View): boolean;
        platformDidSwitchView(view: exui.View): void;

        platformWillOpenViewSwitcher?(): boolean;
        openViewSwitcher(): void;

    }

    class DefaultJob implements Job {

        id: string;
        context: any = {};
        views: any[] = [];
        currentView: View;

        constructor(private delegate: PlatformDelegate) {
            this.id = "job" + this.generateQuickGuid() + "_";
        }

        private generateQuickGuid() {
            return Math.random().toString(36).substring(2, 15);
        }

        addView(component: any): View {
            const view = this.delegate.createNewView(this.generateQuickGuid(), this.context, component);
            this.views.push(view);
            return view;
        }

        setAsCurrent(view: View): void {
            if (this.views.indexOf(view) == -1) {
                throw new Error("View doesn't belongs to the job.");
            }

            this.currentView = view;
            if (!this.delegate.plaftormWillSwitchView || this.delegate.plaftormWillSwitchView(view)) {
                this.delegate.platformDidSwitchView(view);
            }
        }
    }

    export class DefaultPlatform implements Platform {

        private _currentJob: Job;
        public jobs: Job[] = [];

        actionManager: DefaultActionManager;

        constructor(private dataSource: PlatformDataSource, private delegate: PlatformDelegate) {
            this.setupActions();
            this.bootsrap();
        }

        setupActions(): any {
            this.actionManager = new DefaultActionManager(this.dataSource.rootAction, this);
        }

        bootsrap(): any {
            this.setAsCurrent(this.createJob());
        }

        get context(): any {
            return this._currentJob.context;
        }

        get currentJob(): Job {
            return this._currentJob;
        }

        createJob(): Job {
            const job = new DefaultJob(this.delegate);
            this.jobs.push(job);
            return job;
        }

        setAsCurrent(job: Job): void {
            this._currentJob = job;
            this.delegate.platformDidSwitchJob(job);
        }

        execute(action: Action): void {
            const executionContext = action.execute(this.currentJob.context, this);
            this.currentJob.context = { ... this.currentJob.context, ...executionContext }
        }

        openViewSwitcher(): void {
            if (!this.delegate.platformWillOpenViewSwitcher || this.delegate.platformWillOpenViewSwitcher()) {
                this.delegate.openViewSwitcher();
            }
        }
    }
}


