import { Job, View, PlatformDelegate } from "../Model";

export class JobImpl implements Job {

    id: string;
    context: any = {};
    currentView: View;
    private _views: any[] = [];

    constructor(private delegate: PlatformDelegate) {
        this.id = "job" + this.generateQuickGuid() + "_";
    }

    private generateQuickGuid() {
        return Math.random().toString(36).substring(2, 15);
    }

    get views(): View[] {
        return [...this._views];
    }

    pushView(component: any): View {
        const view = this.delegate.createNewView(this.generateQuickGuid(), this.context, component);
        this._views.push(view);
        return view;
    }

    popView(): void {
        const viewIndex = this._views.indexOf(this.currentView);
        this._views.splice(viewIndex, 1);
        if (!this.delegate.plaftormWillCloseView || this.delegate.plaftormWillCloseView(this.currentView)) {
            this.delegate.plaftormDidCloseView(this.currentView);
            if (viewIndex > 0) {
                this.setAsCurrent(this._views[viewIndex - 1])
            }
        }
    }

    setAsCurrent(view: View): void {
        this.checkForAbsence(view);

        this.currentView = view;
        if (!this.delegate.plaftormWillSwitchView || this.delegate.plaftormWillSwitchView(view)) {
            this.delegate.platformDidSwitchView(view);
        }
    }

    private checkForAbsence(view: View): void {
        if (this.views.indexOf(view) == -1) {
            throw new Error("View doesn't belongs to the job.");
        }
    }
}
