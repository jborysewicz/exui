import { JobImpl } from "./Job";
import { ActionManagerImpl } from "./ActionManager";
import { Platform, Job, PlatformDataSource, PlatformDelegate, Action } from "../Model";

export class DefaultPlatform implements Platform {

    private _currentJob: Job;
    public jobs: Job[] = [];

    actionManager: ActionManagerImpl;

    constructor(private dataSource: PlatformDataSource, private delegate: PlatformDelegate) {
        this.setupActions();
        this.bootsrap();
    }

    setupActions(): any {
        this.actionManager = new ActionManagerImpl(this.dataSource.rootAction, this);
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
        const job = new JobImpl(this.delegate);
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