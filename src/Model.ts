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
    findActionByFlatName(flatName: string): Action;
}

export interface ContextDataSource {
    context?: any
}

export interface PlatformDataSource extends ContextDataSource {
    rootAction: Action;
}

export interface PlatformDelegate {

    createNewView(id: string, context: any, component: any): View;

    platformWillSwitchJob?(job: Job): boolean;
    platformDidSwitchJob(job: Job): void;

    plaftormWillSwitchView?(view: View): boolean;
    platformDidSwitchView(view: View): void;

    platformWillOpenViewSwitcher?(): boolean;
    openViewSwitcher(): void;
}
