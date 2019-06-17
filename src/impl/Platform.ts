import { JobImpl } from "./Job";
import { ActionManagerImpl } from "./ActionManager";
import { Platform, Job, PlatformDataSource, PlatformDelegate, Action, ActionManager, SwitchDirection } from "../Model";

let platform: Platform;
let actionManager: ActionManager;
let platformHook: PlatformHook;

export function registerPlatformHook(hook: () => PlatformHook) {
    if (platformHook) {
        throw new Error(`Platform already initialized`);
    }
    const result = hook();

    platform = new DefaultPlatform(result.dataSource, result.delegate);
    actionManager = new ActionManagerImpl(result.dataSource.rootAction, {
        get context() {
            return platform.context
        }
    });
}

class DefaultPlatform implements Platform {

    private _currentJob: Job;
    public jobs: Job[] = [];

    constructor(private dataSource: PlatformDataSource, private delegate: PlatformDelegate) {
        this.bootsrap();
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

    async execute(actionName: string, context?: any): Promise<any> {
        const action = actionManager.findActionByFlatName(actionName);
        if (action == null) {
            throw new Error(`Action for name: ${actionName} is unavailable`);
        }

        const executionContext = await action.execute({ ...this.currentJob.context, ...context });
        this.currentJob.context = { ...this.currentJob.context, ...executionContext }
        console.log(this.currentJob.context);
        return executionContext;
    }

    openViewSwitcher(direction?: SwitchDirection): void {
        if (!this.delegate.platformWillOpenViewSwitcher || this.delegate.platformWillOpenViewSwitcher()) {
            this.delegate.openViewSwitcher(direction);
        }
    }
}
export interface PlatformHook {
    dataSource: PlatformDataSource,
    delegate: PlatformDelegate
}

export const exui = {

    get platform() {
        return platform
    },

    get actionManager() {
        return actionManager
    }
}