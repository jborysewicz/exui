import { Job, View, PlatformDelegate } from "../Model";

export class JobImpl implements Job {

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

    removeView(view: View): void {
        this.checkForAbsence(view);

        const viewIndex = this.views.indexOf(view);
        this.views.splice(viewIndex, 1);
        if (!this.delegate.plaftormWillCloseView || this.delegate.plaftormWillCloseView(view)) {
            this.delegate.plaftormDidCloseView(view);
        }

        if (viewIndex > 0) {
            this.setAsCurrent(this.views[viewIndex - 1])
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
