export interface Action {
    name: string
    execute?(context?: any): Promise<any>
    matchesContext?(context: any): boolean
    leafs?: Action[],
    isSearchable?: boolean
}

export interface ContextSource {
    job: any,
    view: any
}

export interface Platform {
    context: any;
    jobs: Job[];

    currentJob: Job;

    createJob(): Job;
    setAsCurrent(job: Job): void;

    execute(actionName: string, context?: any): Promise<any>;
    openViewSwitcher(direction?: SwitchDirection): void
}

export interface Job {
    id: string;
    views: View[];
    context?: any;
    currentView: View;

    pushView(component: any): View;
    setAsCurrent(view: View): void;
    popView(): void;
}

export interface View {
    name: string,
    component: any
}

export interface ContextProvider {
    updateContext(currentContext: any): any
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

export enum SwitchDirection {
    NextJob = 40,
    PreviousJob = 38,
    NextView = 39,
    PreviousView = 37
}

export interface PlatformDelegate {

    createNewView(id: string, context: any, component: any): View;

    platformWillSwitchJob?(job: Job): boolean;
    platformDidSwitchJob(job: Job): void;

    plaftormWillSwitchView?(view: View): boolean;
    platformDidSwitchView(view: View): void;

    plaftormWillCloseView?(view: View): boolean;
    plaftormDidCloseView(view: View): void;

    platformWillOpenViewSwitcher?(): boolean;
    openViewSwitcher(direction?: SwitchDirection): void;
}
